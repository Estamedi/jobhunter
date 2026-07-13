using backend.jobhunter.Domain.Constants;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace backend.jobhunter.Infrastructure.Identity;

/// <summary>
/// Every self-service account (email/password register via MapIdentityApi, or first-time
/// Google sign-in) goes through UserManager.CreateAsync, so this is the one place that can
/// intercept both paths to grant the default "JobSeeker" role. Administratively created users
/// (e.g. the seeded administrator) get this role too and must explicitly remove it afterwards.
/// </summary>
public class ApplicationUserManager : UserManager<ApplicationUser>
{
    private readonly RoleManager<IdentityRole> _roleManager;

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
        RoleManager<IdentityRole> roleManager)
        : base(store, optionsAccessor, passwordHasher, userValidators, passwordValidators, keyNormalizer, errors, services, logger)
    {
        _roleManager = roleManager;
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
}
