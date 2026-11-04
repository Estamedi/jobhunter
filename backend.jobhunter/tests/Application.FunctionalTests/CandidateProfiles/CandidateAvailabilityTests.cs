using backend.jobhunter.Application.CandidateProfiles.Commands.UpdateCandidateContact;
using backend.jobhunter.Application.Candidates.Queries.GetCandidate;
using backend.jobhunter.Application.Candidates.Queries.GetCandidates;
using backend.jobhunter.Application.Candidates.Queries.GetMyCandidate;
using backend.jobhunter.Domain.Entities;
using backend.jobhunter.Infrastructure.Data;
using Microsoft.Extensions.DependencyInjection;

namespace backend.jobhunter.Application.FunctionalTests.CandidateProfiles;

// The profile page reads the candidate through "me", not through the list, so every read has to carry it.
public class CandidateAvailabilityTests : TestBase
{
    private static async Task<int> CandidateAsync()
    {
        await TestApp.RunAsDefaultUserAsync();
        using var scope = FunctionalTestSetup.ScopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var candidate = new Candidate { FullName = "Jane Sample", Email = "jane@example.com" };
        db.Candidates.Add(candidate);
        await db.SaveChangesAsync();
        return candidate.Id;
    }

    [Test]
    public async Task ShouldReadAvailabilityBackThroughEveryCandidateQuery()
    {
        var id = await CandidateAsync();

        await TestApp.SendAsync(new UpdateCandidateContactCommand
        {
            CandidateId = id, FullName = "Jane Sample", Email = "jane@example.com", Availability = "  1 month notice ",
        });

        (await TestApp.SendAsync(new GetMyCandidateQuery())).Availability.ShouldBe("1 month notice");
        (await TestApp.SendAsync(new GetCandidateQuery(id))).Availability.ShouldBe("1 month notice");
        (await TestApp.SendAsync(new GetCandidatesQuery())).Items.Single().Availability.ShouldBe("1 month notice");
    }

    [Test]
    public async Task ShouldClearAvailabilityWhenItIsSavedEmptyAndRejectATooLongOne()
    {
        var id = await CandidateAsync();
        await TestApp.SendAsync(new UpdateCandidateContactCommand { CandidateId = id, FullName = "Jane", Email = "jane@example.com", Availability = "Immediately" });

        await TestApp.SendAsync(new UpdateCandidateContactCommand { CandidateId = id, FullName = "Jane", Email = "jane@example.com", Availability = "  " });
        (await TestApp.SendAsync(new GetMyCandidateQuery())).Availability.ShouldBeNull();

        await Should.ThrowAsync<backend.jobhunter.Application.Common.Exceptions.ValidationException>(() =>
            TestApp.SendAsync(new UpdateCandidateContactCommand { CandidateId = id, FullName = "Jane", Email = "jane@example.com", Availability = new string('x', 61) }));
    }
}
