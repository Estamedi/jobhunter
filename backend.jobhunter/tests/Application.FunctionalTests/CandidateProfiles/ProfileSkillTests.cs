using backend.jobhunter.Application.CandidateProfiles.Commands.AddProfileSkill;
using backend.jobhunter.Application.CandidateProfiles.Commands.UpdateProfileSkill;
using backend.jobhunter.Domain.Entities;
using backend.jobhunter.Domain.Enums;
using backend.jobhunter.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace backend.jobhunter.Application.FunctionalTests.CandidateProfiles;

public class ProfileSkillTests : TestBase
{
    private static async Task<int> CreateCandidateAsync()
    {
        if (TestApp.GetUserId() is null) await TestApp.RunAsDefaultUserAsync();

        using var scope = FunctionalTestSetup.ScopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var candidate = new Candidate { FullName = "Jane Sample", Email = "jane@example.com" };
        db.Candidates.Add(candidate);
        await db.SaveChangesAsync();
        return candidate.Id;
    }

    private static async Task<ProfileSkill> LoadAsync(int id)
    {
        using var scope = FunctionalTestSetup.ScopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        return await db.ProfileSkills.AsNoTracking().SingleAsync(s => s.Id == id);
    }

    [Test]
    public async Task ShouldSaveTheLevelAndNoteOfANewSkill()
    {
        var candidateId = await CreateCandidateAsync();

        var id = await TestApp.SendAsync(new AddProfileSkillCommand
        {
            CandidateId = candidateId, Name = "Java", EvidenceLevel = "project", Note = "built a billing API",
        });

        var skill = await LoadAsync(id);
        skill.EvidenceLevel.ShouldBe(SkillEvidenceLevel.Project);
        skill.Note.ShouldBe("built a billing API");
    }

    [Test]
    public async Task ShouldKeepASkillWithNoLevelAsNotSet()
    {
        var candidateId = await CreateCandidateAsync();

        var id = await TestApp.SendAsync(new AddProfileSkillCommand { CandidateId = candidateId, Name = "SQL" });

        (await LoadAsync(id)).EvidenceLevel.ShouldBeNull();
    }

    [Test]
    public async Task ShouldChangeTheLevelOfAnExistingSkill()
    {
        var candidateId = await CreateCandidateAsync();
        var id = await TestApp.SendAsync(new AddProfileSkillCommand { CandidateId = candidateId, Name = "Java", EvidenceLevel = "Learning" });

        await TestApp.SendAsync(new UpdateProfileSkillCommand { Id = id, Name = "Java", EvidenceLevel = "Claimed", Note = "  used it daily\nat my last job " });

        var skill = await LoadAsync(id);
        skill.EvidenceLevel.ShouldBe(SkillEvidenceLevel.Claimed);
        skill.Note.ShouldBe("used it daily at my last job");
    }

    [Test]
    public async Task ShouldApplyALevelSentWithASkillThatIsAlreadyOnTheProfileAndLeaveItAloneWithoutOne()
    {
        var candidateId = await CreateCandidateAsync();
        var id = await TestApp.SendAsync(new AddProfileSkillCommand { CandidateId = candidateId, Name = "Java" });

        var again = await TestApp.SendAsync(new AddProfileSkillCommand { CandidateId = candidateId, Name = "java" });
        again.ShouldBe(id);
        (await LoadAsync(id)).EvidenceLevel.ShouldBeNull();

        await TestApp.SendAsync(new AddProfileSkillCommand { CandidateId = candidateId, Name = "JAVA", EvidenceLevel = "Course" });
        (await LoadAsync(id)).EvidenceLevel.ShouldBe(SkillEvidenceLevel.Course);

        await TestApp.SendAsync(new AddProfileSkillCommand { CandidateId = candidateId, Name = "Java" });
        (await LoadAsync(id)).EvidenceLevel.ShouldBe(SkillEvidenceLevel.Course);
    }
}
