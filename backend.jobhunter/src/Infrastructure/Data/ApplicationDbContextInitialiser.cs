using System.Reflection;
using backend.jobhunter.Domain.Constants;
using backend.jobhunter.Domain.Entities;
using backend.jobhunter.Infrastructure.Identity;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace backend.jobhunter.Infrastructure.Data;

public static class InitialiserExtensions
{
    public static async Task InitialiseDatabaseAsync(this WebApplication app)
    {
        using var scope = app.Services.CreateScope();

        var initialiser = scope.ServiceProvider.GetRequiredService<ApplicationDbContextInitialiser>();

        await initialiser.InitialiseAsync();
        await initialiser.SeedAsync();
    }
}

public class ApplicationDbContextInitialiser
{
    private readonly ILogger<ApplicationDbContextInitialiser> _logger;
    private readonly ApplicationDbContext _context;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly RoleManager<IdentityRole> _roleManager;

    public ApplicationDbContextInitialiser(ILogger<ApplicationDbContextInitialiser> logger, ApplicationDbContext context, UserManager<ApplicationUser> userManager, RoleManager<IdentityRole> roleManager)
    {
        _logger = logger;
        _context = context;
        _userManager = userManager;
        _roleManager = roleManager;
    }

    public async Task InitialiseAsync()
    {
        try
        {
            await _context.Database.MigrateAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "An error occurred while initialising the database.");
            throw;
        }
    }

    public async Task SeedAsync()
    {
        try
        {
            await TrySeedAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "An error occurred while seeding the database.");
            throw;
        }
    }

    public async Task TrySeedAsync()
    {
        // Default roles
        var administratorRole = new IdentityRole(Roles.Administrator);

        if (_roleManager.Roles.All(r => r.Name != administratorRole.Name))
        {
            await _roleManager.CreateAsync(administratorRole);
        }

        // Default users
        var administrator = new ApplicationUser { UserName = "administrator@localhost.com", Email = "administrator@localhost.com" };

        if (_userManager.Users.All(u => u.UserName != administrator.UserName))
        {
            await _userManager.CreateAsync(administrator, "Administrator1!");
            if (!string.IsNullOrWhiteSpace(administratorRole.Name))
            {
                await _userManager.AddToRolesAsync(administrator, new [] { administratorRole.Name });
                await _userManager.RemoveFromRoleAsync(administrator, Roles.JobSeeker);
            }
        }

        // No per-user CRM data is seeded here. Each job seeker gets their own Candidate row created by
        // ApplicationUserManager, once their account is confirmed (local email confirmation) or
        // right away (Google sign-in, which arrives pre-confirmed).

        // JobTitles is a shared, global reference catalog (not owned by any user), so it's seeded once here.
        await SeedJobTitlesAsync();
    }

    private async Task SeedJobTitlesAsync()
    {
        if (await _context.JobTitles.AnyAsync())
        {
            return;
        }

        var assembly = Assembly.GetExecutingAssembly();
        const string resourceName = "backend.jobhunter.Infrastructure.Data.Seed.job_titles.csv";

        using var stream = assembly.GetManifestResourceStream(resourceName);
        if (stream is null)
        {
            _logger.LogWarning("Job titles seed resource '{ResourceName}' was not found; skipping seed.", resourceName);
            return;
        }

        using var reader = new StreamReader(stream);

        var jobTitles = new List<JobTitle>();
        var isHeaderRow = true;
        string? line;
        while ((line = await reader.ReadLineAsync()) is not null)
        {
            if (isHeaderRow)
            {
                isHeaderRow = false;
                continue;
            }

            if (string.IsNullOrWhiteSpace(line))
            {
                continue;
            }

            var separatorIndex = line.IndexOf(',');
            if (separatorIndex < 0)
            {
                continue;
            }

            var name = line[..separatorIndex].Trim();
            var description = line[(separatorIndex + 1)..].Trim();

            if (name.Length == 0)
            {
                continue;
            }

            jobTitles.Add(new JobTitle
            {
                Name = name,
                Description = description.Length > 0 ? description : null
            });
        }

        _context.JobTitles.AddRange(jobTitles);
        await _context.SaveChangesAsync(CancellationToken.None);
    }
}
