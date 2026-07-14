using backend.jobhunter.Domain.Constants;
using backend.jobhunter.Domain.Entities;
using backend.jobhunter.Domain.Enums;
using backend.jobhunter.Domain.ValueObjects;
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

        // Default data
        if (!_context.TodoLists.Any())
        {
            _context.TodoLists.Add(new TodoList
            {
                Title = "Tasks",
                Colour = Colour.Green,
                Items =
                {
                    new TodoItem { Title = "Make a todo list 📃" },
                    new TodoItem { Title = "Check off the first item ✅" },
                }
            });
            await _context.SaveChangesAsync();
        }

        // CRM seed data
        if (!_context.Candidates.Any())
        {
            await SeedCrmDataAsync();
        }
    }

    private async Task SeedCrmDataAsync()
    {
        // Candidates
        var candidates = new[]
        {
            new Candidate { FullName = "Saber Al-Oman", Email = "saber@example.com", Phone = "+968-1234-5678", CurrentLocation = "Muscat, Oman", TargetCountries = "UAE, UK, USA", PreferredWorkType = "Remote", TargetRoles = "Senior Software Engineer, Tech Lead", IsActive = true },
            new Candidate { FullName = "Ahmed Hassan", Email = "ahmed@example.com", Phone = "+971-9876-5432", CurrentLocation = "Dubai, UAE", TargetCountries = "UK, Germany, Netherlands", PreferredWorkType = "Hybrid", TargetRoles = "Backend Engineer, DevOps", IsActive = true },
            new Candidate { FullName = "Layla Nasser", Email = "layla@example.com", Phone = "+44-7700-123456", CurrentLocation = "London, UK", TargetCountries = "USA, Canada", PreferredWorkType = "Remote", TargetRoles = "Product Manager, Engineering Manager", IsActive = true },
            new Candidate { FullName = "Omar Khalid", Email = "omar@example.com", Phone = "+1-555-0187", CurrentLocation = "Toronto, Canada", TargetCountries = "USA", PreferredWorkType = "OnSite", TargetRoles = "Data Scientist, ML Engineer", IsActive = true },
        };
        _context.Candidates.AddRange(candidates);
        await _context.SaveChangesAsync();

        // Companies
        var companies = new[]
        {
            new JobCompany { Name = "Stripe", Website = "https://stripe.com", Country = "USA", City = "San Francisco", Industry = "FinTech", CompanySize = "1000-5000", Priority = "High", LinkedInUrl = "https://linkedin.com/company/stripe" },
            new JobCompany { Name = "Cloudflare", Website = "https://cloudflare.com", Country = "USA", City = "Austin", Industry = "Infrastructure", CompanySize = "1000-5000", Priority = "High" },
            new JobCompany { Name = "Monzo", Website = "https://monzo.com", Country = "UK", City = "London", Industry = "FinTech", CompanySize = "500-1000", Priority = "High" },
            new JobCompany { Name = "Booking.com", Website = "https://booking.com", Country = "Netherlands", City = "Amsterdam", Industry = "Travel", CompanySize = "10000+", Priority = "Medium" },
            new JobCompany { Name = "FAANG Corp", Website = "https://example.com", Country = "USA", City = "New York", Industry = "Technology", CompanySize = "10000+", Priority = "Low" },
        };
        _context.Companies.AddRange(companies);
        await _context.SaveChangesAsync();

        // Contacts
        var contacts = new[]
        {
            new JobContact { FullName = "Emily Chen", CompanyId = companies[0].Id, JobTitle = "Engineering Recruiter", Email = "emily@stripe.com", Type = "Recruiter", Warmth = "Warm" },
            new JobContact { FullName = "James Williams", CompanyId = companies[1].Id, JobTitle = "HR Manager", Email = "james@cloudflare.com", Type = "Recruiter", Warmth = "Cold" },
            new JobContact { FullName = "Sophie Taylor", CompanyId = companies[2].Id, JobTitle = "Tech Lead", Email = "sophie@monzo.com", Type = "HiringManager", Warmth = "Hot" },
        };
        _context.Contacts.AddRange(contacts);
        await _context.SaveChangesAsync();

        // Job Roles
        var roles = new[]
        {
            new JobRole { CompanyId = companies[0].Id, Title = "Senior Backend Engineer", Source = "LinkedIn", Country = "USA", WorkType = "Remote", EmploymentType = "FullTime", RoleStatus = "Open", SalaryMin = 180000, SalaryMax = 250000, Currency = "USD" },
            new JobRole { CompanyId = companies[0].Id, Title = "Staff Engineer", Source = "CompanyWebsite", Country = "USA", WorkType = "Hybrid", EmploymentType = "FullTime", RoleStatus = "Open", SalaryMin = 220000, SalaryMax = 300000, Currency = "USD" },
            new JobRole { CompanyId = companies[1].Id, Title = "Backend Engineer", Source = "LinkedIn", Country = "USA", WorkType = "Remote", EmploymentType = "FullTime", RoleStatus = "Open", SalaryMin = 140000, SalaryMax = 180000, Currency = "USD" },
            new JobRole { CompanyId = companies[2].Id, Title = "Senior Software Engineer", Source = "Referral", Country = "UK", WorkType = "Hybrid", EmploymentType = "FullTime", RoleStatus = "Open", SalaryMin = 90000, SalaryMax = 130000, Currency = "GBP" },
            new JobRole { CompanyId = companies[2].Id, Title = "Engineering Manager", Source = "LinkedIn", Country = "UK", WorkType = "Hybrid", EmploymentType = "FullTime", RoleStatus = "Open", SalaryMin = 120000, SalaryMax = 160000, Currency = "GBP" },
            new JobRole { CompanyId = companies[3].Id, Title = "Backend Developer", Source = "Indeed", Country = "Netherlands", WorkType = "Hybrid", EmploymentType = "FullTime", RoleStatus = "Open", SalaryMin = 70000, SalaryMax = 100000, Currency = "EUR" },
            new JobRole { CompanyId = companies[3].Id, Title = "Data Engineer", Source = "LinkedIn", Country = "Netherlands", WorkType = "Remote", EmploymentType = "FullTime", RoleStatus = "Open" },
            new JobRole { CompanyId = companies[4].Id, Title = "Software Engineer", Source = "Recruiter", Country = "USA", WorkType = "OnSite", EmploymentType = "FullTime", RoleStatus = "Closed" },
            new JobRole { CompanyId = companies[1].Id, Title = "Platform Engineer", Source = "CompanyWebsite", Country = "USA", WorkType = "Remote", EmploymentType = "FullTime", RoleStatus = "Open" },
            new JobRole { CompanyId = companies[4].Id, Title = "ML Engineer", Source = "LinkedIn", Country = "USA", WorkType = "Hybrid", EmploymentType = "FullTime", RoleStatus = "Open" },
        };
        _context.JobRoles.AddRange(roles);
        await _context.SaveChangesAsync();

        var now = DateTimeOffset.UtcNow;

        // Applications (20 across 4 candidates)
        var applications = new[]
        {
            new JobApplication { CandidateId = candidates[0].Id, JobRoleId = roles[0].Id, CompanyId = companies[0].Id, Status = "Applied", Priority = PriorityLevel.High, AppliedDate = now.AddDays(-14), LastActivityDate = now.AddDays(-10), NextFollowUpDate = now.AddDays(-3), MainContactId = contacts[0].Id },
            new JobApplication { CandidateId = candidates[0].Id, JobRoleId = roles[2].Id, CompanyId = companies[1].Id, Status = "HRInterview", Priority = PriorityLevel.High, AppliedDate = now.AddDays(-20), LastActivityDate = now.AddDays(-7), NextFollowUpDate = now.AddDays(2) },
            new JobApplication { CandidateId = candidates[0].Id, JobRoleId = roles[3].Id, CompanyId = companies[2].Id, Status = "TechnicalInterview", Priority = PriorityLevel.Medium, AppliedDate = now.AddDays(-30), LastActivityDate = now.AddDays(-5), NextFollowUpDate = now.AddDays(1), MainContactId = contacts[2].Id },
            new JobApplication { CandidateId = candidates[0].Id, JobRoleId = roles[8].Id, CompanyId = companies[1].Id, Status = "Wishlist", Priority = PriorityLevel.Low, NextFollowUpDate = null },
            new JobApplication { CandidateId = candidates[0].Id, JobRoleId = roles[7].Id, CompanyId = companies[4].Id, Status = "Rejected", Priority = PriorityLevel.Low, AppliedDate = now.AddDays(-45), LastActivityDate = now.AddDays(-40), RejectionReason = "Position filled internally" },

            new JobApplication { CandidateId = candidates[1].Id, JobRoleId = roles[0].Id, CompanyId = companies[0].Id, Status = "Applied", Priority = PriorityLevel.High, AppliedDate = now.AddDays(-7), LastActivityDate = now.AddDays(-7), NextFollowUpDate = now },
            new JobApplication { CandidateId = candidates[1].Id, JobRoleId = roles[5].Id, CompanyId = companies[3].Id, Status = "FinalInterview", Priority = PriorityLevel.High, AppliedDate = now.AddDays(-40), LastActivityDate = now.AddDays(-2) },
            new JobApplication { CandidateId = candidates[1].Id, JobRoleId = roles[6].Id, CompanyId = companies[3].Id, Status = "Offer", Priority = PriorityLevel.High, AppliedDate = now.AddDays(-60), LastActivityDate = now.AddDays(-1), ActualOfferSalary = 85000, Currency = "EUR" },
            new JobApplication { CandidateId = candidates[1].Id, JobRoleId = roles[2].Id, CompanyId = companies[1].Id, Status = "Applied", Priority = PriorityLevel.Medium, AppliedDate = now.AddDays(-3), LastActivityDate = now.AddDays(-3) },
            new JobApplication { CandidateId = candidates[1].Id, JobRoleId = roles[9].Id, CompanyId = companies[4].Id, Status = "Withdrawn", Priority = PriorityLevel.Low, AppliedDate = now.AddDays(-50), LastActivityDate = now.AddDays(-50) },

            new JobApplication { CandidateId = candidates[2].Id, JobRoleId = roles[4].Id, CompanyId = companies[2].Id, Status = "HRInterview", Priority = PriorityLevel.High, AppliedDate = now.AddDays(-10), LastActivityDate = now.AddDays(-3), NextFollowUpDate = now.AddDays(4), MainContactId = contacts[2].Id },
            new JobApplication { CandidateId = candidates[2].Id, JobRoleId = roles[1].Id, CompanyId = companies[0].Id, Status = "Applied", Priority = PriorityLevel.High, AppliedDate = now.AddDays(-5), LastActivityDate = now.AddDays(-5), NextFollowUpDate = now.AddDays(-1), MainContactId = contacts[0].Id },
            new JobApplication { CandidateId = candidates[2].Id, JobRoleId = roles[8].Id, CompanyId = companies[1].Id, Status = "Rejected", Priority = PriorityLevel.Medium, AppliedDate = now.AddDays(-25), LastActivityDate = now.AddDays(-20), RejectionReason = "Culture fit concerns" },
            new JobApplication { CandidateId = candidates[2].Id, JobRoleId = roles[5].Id, CompanyId = companies[3].Id, Status = "Wishlist", Priority = PriorityLevel.Low },
            new JobApplication { CandidateId = candidates[2].Id, JobRoleId = roles[3].Id, CompanyId = companies[2].Id, Status = "TechnicalInterview", Priority = PriorityLevel.Medium, AppliedDate = now.AddDays(-15), LastActivityDate = now.AddDays(-8) },

            new JobApplication { CandidateId = candidates[3].Id, JobRoleId = roles[9].Id, CompanyId = companies[4].Id, Status = "Applied", Priority = PriorityLevel.High, AppliedDate = now.AddDays(-3), LastActivityDate = now.AddDays(-3), NextFollowUpDate = now.AddDays(4) },
            new JobApplication { CandidateId = candidates[3].Id, JobRoleId = roles[6].Id, CompanyId = companies[3].Id, Status = "HRInterview", Priority = PriorityLevel.High, AppliedDate = now.AddDays(-18), LastActivityDate = now.AddDays(-14), NextFollowUpDate = now },
            new JobApplication { CandidateId = candidates[3].Id, JobRoleId = roles[2].Id, CompanyId = companies[1].Id, Status = "Offer", Priority = PriorityLevel.High, AppliedDate = now.AddDays(-55), LastActivityDate = now.AddDays(-3), ActualOfferSalary = 155000, Currency = "USD" },
            new JobApplication { CandidateId = candidates[3].Id, JobRoleId = roles[5].Id, CompanyId = companies[3].Id, Status = "Rejected", Priority = PriorityLevel.Medium, AppliedDate = now.AddDays(-35), LastActivityDate = now.AddDays(-30), RejectionReason = "Skills mismatch" },
            new JobApplication { CandidateId = candidates[3].Id, JobRoleId = roles[8].Id, CompanyId = companies[1].Id, Status = "Wishlist", Priority = PriorityLevel.Low },
        };
        _context.Applications.AddRange(applications);
        await _context.SaveChangesAsync();

        // Activities (10)
        var activities = new[]
        {
            new JobActivity { CandidateId = candidates[0].Id, ApplicationId = applications[0].Id, CompanyId = companies[0].Id, ContactId = contacts[0].Id, Type = "Email", ActivityDate = now.AddDays(-14), Outcome = "Responded", Notes = "Applied via LinkedIn. Got auto-confirmation." },
            new JobActivity { CandidateId = candidates[0].Id, ApplicationId = applications[1].Id, CompanyId = companies[1].Id, Type = "Call", ActivityDate = now.AddDays(-18), Outcome = "Scheduled", Notes = "Recruiter called to schedule HR screen" },
            new JobActivity { CandidateId = candidates[0].Id, ApplicationId = applications[2].Id, CompanyId = companies[2].Id, ContactId = contacts[2].Id, Type = "Note", ActivityDate = now.AddDays(-28), Outcome = "Responded", Notes = "Connected with hiring manager on LinkedIn" },
            new JobActivity { CandidateId = candidates[1].Id, ApplicationId = applications[7].Id, CompanyId = companies[3].Id, Type = "Email", ActivityDate = now.AddDays(-5), Outcome = "Positive", Notes = "Received written offer! Reviewing terms." },
            new JobActivity { CandidateId = candidates[1].Id, ApplicationId = applications[5].Id, CompanyId = companies[0].Id, Type = "FollowUp", ActivityDate = now.AddDays(-6), Outcome = "NoResponse", Notes = "Sent follow-up email, no response yet" },
            new JobActivity { CandidateId = candidates[2].Id, ApplicationId = applications[10].Id, CompanyId = companies[2].Id, ContactId = contacts[2].Id, Type = "Meeting", ActivityDate = now.AddDays(-9), Outcome = "Positive", Notes = "HR screen went well, moving to technical" },
            new JobActivity { CandidateId = candidates[2].Id, ApplicationId = applications[11].Id, CompanyId = companies[0].Id, Type = "FollowUp", ActivityDate = now.AddDays(-4), Outcome = "NoResponse", Notes = "No response after applying, sent follow-up" },
            new JobActivity { CandidateId = candidates[3].Id, ApplicationId = applications[17].Id, CompanyId = companies[1].Id, Type = "Email", ActivityDate = now.AddDays(-4), Outcome = "Positive", Notes = "Received offer letter from Cloudflare!" },
            new JobActivity { CandidateId = candidates[3].Id, ApplicationId = applications[16].Id, CompanyId = companies[3].Id, Type = "Meeting", ActivityDate = now.AddDays(-15), Outcome = "Scheduled", Notes = "HR interview scheduled for next week" },
            new JobActivity { CandidateId = candidates[0].Id, CompanyId = companies[0].Id, Type = "Note", ActivityDate = now.AddDays(-21), Notes = "Researched Stripe tech stack and culture. Strong fit." },
        };
        _context.Activities.AddRange(activities);
        await _context.SaveChangesAsync();

        // Interviews (5)
        var interviews = new[]
        {
            new JobInterview { ApplicationId = applications[1].Id, CandidateId = candidates[0].Id, CompanyId = companies[1].Id, Round = "HR", InterviewDate = now.AddDays(-13), Status = "Completed", InterviewNotes = "Good culture fit discussion. Salary expectations aligned.", Feedback = "Moving to technical round" },
            new JobInterview { ApplicationId = applications[2].Id, CandidateId = candidates[0].Id, CompanyId = companies[2].Id, Round = "Technical", InterviewDate = now.AddDays(3), Status = "Scheduled", MeetingLink = "https://meet.google.com/abc-defg-hij", PreparationNotes = "Review system design patterns, Monzo tech stack" },
            new JobInterview { ApplicationId = applications[6].Id, CandidateId = candidates[1].Id, CompanyId = companies[3].Id, Round = "Final", InterviewDate = now.AddDays(5), Status = "Scheduled", MeetingLink = "https://zoom.us/j/123456789", InterviewerName = "VP Engineering" },
            new JobInterview { ApplicationId = applications[10].Id, CandidateId = candidates[2].Id, CompanyId = companies[2].Id, Round = "HR", InterviewDate = now.AddDays(-9), Status = "Completed", InterviewNotes = "Strong candidate, clear communication", Feedback = "Recommended for technical" },
            new JobInterview { ApplicationId = applications[14].Id, CandidateId = candidates[2].Id, CompanyId = companies[2].Id, Round = "Technical", InterviewDate = now.AddDays(7), Status = "Scheduled", PreparationNotes = "Prepare for system design and coding challenges" },
        };
        _context.Interviews.AddRange(interviews);
        await _context.SaveChangesAsync();
    }
}
