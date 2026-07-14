using backend.jobhunter.Application.Common.Interfaces;
using backend.jobhunter.Domain.Constants;
using backend.jobhunter.Domain.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace backend.jobhunter.Infrastructure.Identity;

/// <summary>
/// Every self-service account (email/password register via MapIdentityApi, or first-time
/// Google sign-in) goes through UserManager.CreateAsync, so this is the one place that can
/// intercept both paths to grant the default "JobSeeker" role. Administratively created users
/// (e.g. the seeded administrator) get this role too and must explicitly remove it afterwards.
/// Candidate self-profile seeding is hooked separately, only once a user's email is actually
/// confirmed (immediately for Google sign-in, or via ConfirmEmailAsync for local sign-up) so the
/// admin account and unconfirmed sign-ups never get a Candidate row.
/// </summary>
public class ApplicationUserManager : UserManager<ApplicationUser>
{
    private readonly RoleManager<IdentityRole> _roleManager;
    private readonly IApplicationDbContext _dbContext;

    public ApplicationUserManager(
        IUserStore<ApplicationUser> store,
        IOptions<IdentityOptions> optionsAccessor,
        IPasswordHasher<ApplicationUser> passwordHasher,
        IEnumerable<IUserValidator<ApplicationUser>> userValidators,
        IEnumerable<IPasswordValidator<ApplicationUser>> passwordValidators,
        ILookupNormalizer keyNormalizer,
        IdentityErrorDescriber errors,
        IServiceProvider services,
        ILogger<UserManager<ApplicationUser>> logger,
        RoleManager<IdentityRole> roleManager,
        IApplicationDbContext dbContext)
        : base(store, optionsAccessor, passwordHasher, userValidators, passwordValidators, keyNormalizer, errors, services, logger)
    {
        _roleManager = roleManager;
        _dbContext = dbContext;
    }

    public override async Task<IdentityResult> CreateAsync(ApplicationUser user, string password)
    {
        var result = await base.CreateAsync(user, password);

        if (result.Succeeded)
        {
            await AssignDefaultRoleAsync(user);
        }

        return result;
    }

    public override async Task<IdentityResult> CreateAsync(ApplicationUser user)
    {
        var result = await base.CreateAsync(user);

        if (result.Succeeded)
        {
            await AssignDefaultRoleAsync(user);

            // Google sign-in creates the user with EmailConfirmed = true already, so there is
            // no separate confirmation step to hook into for this path.
            if (user.EmailConfirmed)
            {
                await EnsureCandidateProfileAsync(user);
            }
        }

        return result;
    }

    public override async Task<IdentityResult> ConfirmEmailAsync(ApplicationUser user, string token)
    {
        var result = await base.ConfirmEmailAsync(user, token);

        if (result.Succeeded)
        {
            await EnsureCandidateProfileAsync(user);
        }

        return result;
    }

    private async Task AssignDefaultRoleAsync(ApplicationUser user)
    {
        if (!await _roleManager.RoleExistsAsync(Roles.JobSeeker))
        {
            await _roleManager.CreateAsync(new IdentityRole(Roles.JobSeeker));
        }

        await AddToRoleAsync(user, Roles.JobSeeker);
    }

    /// <summary>
    /// Every job seeker manages their own job search as a Candidate, so as soon as their account
    /// is confirmed we give them a Candidate row of their own, owned by them, so they land in the
    /// Candidates table seeing themselves. Query filters are bypassed here because this can run
    /// with no signed-in user (e.g. an anonymous email-confirmation link).
    /// </summary>
    private async Task EnsureCandidateProfileAsync(ApplicationUser user)
    {
        if (!Guid.TryParse(user.Id, out var ownerId))
        {
            return;
        }

        var alreadyHasCandidate = await _dbContext.Candidates
            .IgnoreQueryFilters()
            .AnyAsync(c => c.OwnerId == ownerId);

        if (alreadyHasCandidate)
        {
            return;
        }

        _dbContext.Candidates.Add(new Candidate
        {
            OwnerId = ownerId,
            FullName = user.UserName ?? user.Email ?? "New Candidate",
            Email = user.Email ?? string.Empty,
            IsActive = true,
        });

        await _dbContext.SaveChangesAsync(CancellationToken.None);
    }
}
