using backend.jobhunter.Application.Common.Interfaces;
using backend.jobhunter.Application.CvDrafts;
using backend.jobhunter.Application.CvDrafts.Commands.RestoreCvDraftVersion;
using backend.jobhunter.Application.CvDrafts.Commands.UpdateCvDraft;
using backend.jobhunter.Application.CvDrafts.Queries.GetCvDraftVersion;
using backend.jobhunter.Application.CvDrafts.Queries.GetCvDraftVersions;
using backend.jobhunter.Domain.Entities;
using backend.jobhunter.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace backend.jobhunter.Application.FunctionalTests.CvDrafts;

public class CvDraftVersionsTests : TestBase
{
    private static async Task<int> CreateDraftAsync(string summary = "First")
    {
        // A second draft in the same test reuses the user created for the first.
        if (TestApp.GetUserId() is null) await TestApp.RunAsDefaultUserAsync();

        using var scope = FunctionalTestSetup.ScopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

        var candidate = new Candidate { FullName = "Jane Sample", Email = "jane@example.com" };
        var draft = new CvDraft
        {
            Candidate = candidate,
            Title = "CV",
            JobTitle = "Engineer",
            ContentJson = CvDraftContent.Serialize(new GeneratedCvDto { Summary = summary }),
        };
        db.CvDrafts.Add(draft);
        await db.SaveChangesAsync();
        return draft.Id;
    }

    private static UpdateCvDraftCommand Edit(int id, string summary) => new()
    {
        Id = id, Title = "CV", TemplateId = "classic", Content = new GeneratedCvDto { Summary = summary },
    };

    [Test]
    public async Task ShouldSaveTheReplacedContentAsAVersionWhenAnEditChangesIt()
    {
        var id = await CreateDraftAsync("First");

        var updated = await TestApp.SendAsync(Edit(id, "Second"));

        updated.Content.Summary.ShouldBe("Second");
        updated.PreviousVersionId.ShouldNotBeNull();
        var versions = await TestApp.SendAsync(new GetCvDraftVersionsQuery(id));
        var version = versions.ShouldHaveSingleItem();
        version.Reason.ShouldBe("Before editing by hand");
        var detail = await TestApp.SendAsync(new GetCvDraftVersionQuery(id, version.Id));
        detail.Content.Summary.ShouldBe("First");
    }

    [Test]
    public async Task ShouldNotSaveAVersionWhenNothingChanged()
    {
        var id = await CreateDraftAsync("Same");

        var updated = await TestApp.SendAsync(Edit(id, "Same"));

        updated.PreviousVersionId.ShouldBeNull();
        (await TestApp.SendAsync(new GetCvDraftVersionsQuery(id))).ShouldBeEmpty();
    }

    [Test]
    public async Task ShouldRestoreAVersionAndKeepTheCurrentContentSoTheRestoreCanBeUndone()
    {
        var id = await CreateDraftAsync("First");
        var edited = await TestApp.SendAsync(Edit(id, "Second"));

        var restored = await TestApp.SendAsync(new RestoreCvDraftVersionCommand(id, edited.PreviousVersionId!.Value));

        restored.Content.Summary.ShouldBe("First");
        restored.PreviousVersionId.ShouldNotBeNull();
        var undone = await TestApp.SendAsync(new RestoreCvDraftVersionCommand(id, restored.PreviousVersionId!.Value));
        undone.Content.Summary.ShouldBe("Second");
    }

    [Test]
    public async Task ShouldKeepOnlyTheLastTwentyVersions()
    {
        var id = await CreateDraftAsync("v0");

        for (var i = 1; i <= 23; i++) await TestApp.SendAsync(Edit(id, $"v{i}"));

        var versions = await TestApp.SendAsync(new GetCvDraftVersionsQuery(id));
        versions.Count.ShouldBe(20);
        // Newest first: the version made by the last edit holds the content before it.
        (await TestApp.SendAsync(new GetCvDraftVersionQuery(id, versions[0].Id))).Content.Summary.ShouldBe("v22");
        (await TestApp.SendAsync(new GetCvDraftVersionQuery(id, versions[^1].Id))).Content.Summary.ShouldBe("v3");
    }

    [Test]
    public async Task ShouldNotRestoreAVersionThatBelongsToAnotherDraft()
    {
        var first = await CreateDraftAsync("A");
        var second = await CreateDraftAsync("B");
        var edited = await TestApp.SendAsync(Edit(first, "A2"));

        await Should.ThrowAsync<NotFoundException>(
            () => TestApp.SendAsync(new RestoreCvDraftVersionCommand(second, edited.PreviousVersionId!.Value)));
        await Should.ThrowAsync<NotFoundException>(
            () => TestApp.SendAsync(new GetCvDraftVersionQuery(second, edited.PreviousVersionId!.Value)));
    }
}
