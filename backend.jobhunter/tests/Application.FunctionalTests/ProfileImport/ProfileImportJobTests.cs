using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using backend.jobhunter.Application.CandidateProfiles.Commands.ImportProfile;
using backend.jobhunter.Application.CandidateProfiles.Commands.StartProfileImport;
using backend.jobhunter.Application.CandidateProfiles.Queries.GetProfileImportJob;
using backend.jobhunter.Application.Common.Exceptions;
using backend.jobhunter.Application.Common.Interfaces;
using backend.jobhunter.Application.Cvs.Commands.UploadCv;
using backend.jobhunter.Domain.Entities;
using backend.jobhunter.Domain.Enums;
using backend.jobhunter.Infrastructure.CvRendering;
using backend.jobhunter.Infrastructure.Data;
using backend.jobhunter.Infrastructure.Identity;
using backend.jobhunter.Infrastructure.ProfileImport;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using QuestPDF.Fluent;

namespace backend.jobhunter.Application.FunctionalTests.ProfileImport;

// The CV import runs in the background worker against the real database, the real file storage and the real
// text extractor. Only the AI is replaced.
public class ProfileImportJobTests : TestBase
{
    private static readonly TimeSpan Wait = TimeSpan.FromSeconds(30);

    [SetUp]
    public void ResetFakes() => FakeProfileImportAi.Reset();

    private static byte[] CvPdf(string name = "Jane Sample")
        => new QuestPdfCvRenderer().Render("classic", new CvHeaderDto(name, "jane@example.test", "123", "Muscat"),
            new GeneratedCvDto
            {
                Summary = "Engineer with 12 years of experience.",
                Experience = [new CvExperienceDto { Role = "Lead", Company = "Acme", StartDate = "Jan 2022", Bullets = ["Cut costs by 30%."] }],
            });

    // A PDF that is only a picture, like a scan: there is no text to read.
    private static byte[] ScannedPdf()
        => QuestPDF.Fluent.Document.Create(d => d.Page(p =>
            p.Content().Image(CvImages.QrCodePng("a scan, not text")))).GeneratePdf();

    private static async Task<(int CandidateId, int CvId)> UploadAsync(byte[]? pdf = null, string fileName = "cv.pdf")
    {
        if (TestApp.GetUserId() is null) await TestApp.RunAsDefaultUserAsync();
        int candidateId;
        using (var scope = FunctionalTestSetup.ScopeFactory.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var candidate = new Candidate { FullName = "Jane Sample", Email = "jane@example.test" };
            db.Candidates.Add(candidate);
            await db.SaveChangesAsync();
            candidateId = candidate.Id;
        }

        var bytes = pdf ?? CvPdf();
        await using var stream = new MemoryStream(bytes);
        var cvId = await TestApp.SendAsync(new UploadCvCommand
        {
            CandidateId = candidateId, FileName = fileName, ContentType = "application/pdf",
            FileSizeBytes = bytes.Length, Content = stream,
        });
        return (candidateId, cvId);
    }

    private static async Task<ProfileImportJob> LoadAsync(int id)
    {
        using var scope = FunctionalTestSetup.ScopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        return await db.ProfileImportJobs.IgnoreQueryFilters().AsNoTracking().SingleAsync(j => j.Id == id);
    }

    private static async Task<ProfileImportJob> WaitForAsync(int id, ProfileImportStatus status)
    {
        var deadline = DateTime.UtcNow + Wait;
        while (DateTime.UtcNow < deadline)
        {
            var job = await LoadAsync(id);
            if (job.Status == status) return job;
            await Task.Delay(100);
        }
        var last = await LoadAsync(id);
        throw new TimeoutException($"Job {id} was {last.Status}, expected {status}. Error: {last.Error}");
    }

    [Test]
    public async Task ShouldAcceptTheImportAtOnceAndReadTheCvInTheBackground()
    {
        var gate = new TaskCompletionSource<ParsedProfileDto>();
        FakeProfileImportAi.OnParse = _ => gate.Task;
        var (_, cvId) = await UploadAsync();

        var started = await TestApp.SendAsync(new StartProfileImportCommand(cvId));

        started.Status.ShouldBe("Pending");
        started.Result.ShouldBeNull();
        started.FileName.ShouldBe("cv.pdf");
        gate.SetResult(FakeProfileImportAi.SampleProfile());
        await WaitForAsync(started.Id, ProfileImportStatus.Completed);

        var done = await TestApp.SendAsync(new GetProfileImportJobQuery(started.Id));
        done.Status.ShouldBe("Completed");
        done.Result!.Headline.ShouldBe("Senior engineer");
        done.Result.Experiences.ShouldHaveSingleItem().Company.ShouldBe("Acme");
        FakeProfileImportAi.LastText.ShouldNotBeNull().ShouldContain("Jane Sample");
    }

    [Test]
    public async Task ShouldReturnTheSameJobAndMakeOneAiCallWhenStartedTwice()
    {
        var gate = new TaskCompletionSource<ParsedProfileDto>();
        FakeProfileImportAi.OnParse = _ => gate.Task;
        var (_, cvId) = await UploadAsync();

        var first = await TestApp.SendAsync(new StartProfileImportCommand(cvId));
        var second = await TestApp.SendAsync(new StartProfileImportCommand(cvId));
        gate.SetResult(FakeProfileImportAi.SampleProfile());
        await WaitForAsync(first.Id, ProfileImportStatus.Completed);
        var third = await TestApp.SendAsync(new StartProfileImportCommand(cvId));

        second.Id.ShouldBe(first.Id);
        third.Id.ShouldBe(first.Id);
        third.Status.ShouldBe("Completed");
        third.Result.ShouldNotBeNull();
        FakeProfileImportAi.Calls.ShouldBe(1);
    }

    [Test]
    public async Task ShouldKeepTheAiMessageWhenTheProviderFailsAndQueueTheSameJobAgainOnRetry()
    {
        FakeProfileImportAi.OnParse = _ => throw new AiServiceException(AiFailure.Unavailable, "The AI service is down.");
        var (_, cvId) = await UploadAsync();
        var started = await TestApp.SendAsync(new StartProfileImportCommand(cvId));
        var failed = await WaitForAsync(started.Id, ProfileImportStatus.Failed);
        failed.Error.ShouldBe("The AI service is down.");
        (await TestApp.SendAsync(new GetProfileImportJobQuery(started.Id))).Error.ShouldBe("The AI service is down.");

        FakeProfileImportAi.OnParse = null;
        var retried = await TestApp.SendAsync(new StartProfileImportCommand(cvId));

        retried.Id.ShouldBe(started.Id);
        retried.Status.ShouldBe("Pending");
        retried.Error.ShouldBeNull();
        await WaitForAsync(started.Id, ProfileImportStatus.Completed);
    }

    [Test]
    public async Task ShouldNotLeakAnUnexpectedErrorToTheUser()
    {
        FakeProfileImportAi.OnParse = _ => throw new InvalidOperationException("connection string leaked");
        var (_, cvId) = await UploadAsync();

        var started = await TestApp.SendAsync(new StartProfileImportCommand(cvId));
        var failed = await WaitForAsync(started.Id, ProfileImportStatus.Failed);

        failed.Error.ShouldBe(backend.jobhunter.Application.CandidateProfiles.ProfileImportService.UnreadableMessage);
    }

    [Test]
    public async Task ShouldFailAScannedPdfAtOnceWithoutPayingForAnAiCall()
    {
        var (_, cvId) = await UploadAsync(ScannedPdf());

        var started = await TestApp.SendAsync(new StartProfileImportCommand(cvId));
        var failed = await WaitForAsync(started.Id, ProfileImportStatus.Failed);

        failed.Error.ShouldNotBeNull().ShouldContain("No readable text");
        FakeProfileImportAi.Calls.ShouldBe(0);
    }

    [Test]
    public async Task ShouldNotLetAnotherUserStartOrReadTheImport()
    {
        var (_, cvId) = await UploadAsync();
        var started = await TestApp.SendAsync(new StartProfileImportCommand(cvId));

        await TestApp.RunAsUserAsync("other-user@local", "Testing1234!", []);

        await Should.ThrowAsync<NotFoundException>(() => TestApp.SendAsync(new StartProfileImportCommand(cvId)));
        await Should.ThrowAsync<NotFoundException>(() => TestApp.SendAsync(new GetProfileImportJobQuery(started.Id)));
    }

    [Test]
    public async Task ShouldReadTheOwnersCvEvenWhenAnotherUserIsSignedInElsewhere()
    {
        FakeProfileImportAi.OnParse = _ => throw new AiServiceException(AiFailure.Unavailable, "down");
        var (_, cvId) = await UploadAsync(CvPdf("Owner A Person"));
        var started = await TestApp.SendAsync(new StartProfileImportCommand(cvId));
        await WaitForAsync(started.Id, ProfileImportStatus.Failed);
        FakeProfileImportAi.OnParse = null;

        // User B is the current test user now, so only the worker's switch to the owner can find A's CV.
        await TestApp.RunAsUserAsync("other-b@local", "Testing1234!", []);
        using (var scope = FunctionalTestSetup.ScopeFactory.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            await db.ProfileImportJobs.IgnoreQueryFilters().Where(j => j.Id == started.Id)
                .ExecuteUpdateAsync(s => s.SetProperty(j => j.Status, ProfileImportStatus.Pending));
            scope.ServiceProvider.GetRequiredService<IProfileImportSignal>().Notify();
        }

        await WaitForAsync(started.Id, ProfileImportStatus.Completed);
        FakeProfileImportAi.LastText.ShouldNotBeNull().ShouldContain("Owner A Person");
    }

    [Test]
    public async Task ShouldPutInterruptedJobsBackInTheQueueOrFailThemAfterTooManyTries()
    {
        var (_, first) = await UploadAsync();
        var (_, second) = await UploadAsync();
        int retryId, tooManyId;
        using (var scope = FunctionalTestSetup.ScopeFactory.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var retry = new ProfileImportJob { CvId = first, Status = ProfileImportStatus.Running, Attempts = 1 };
            var tooMany = new ProfileImportJob { CvId = second, Status = ProfileImportStatus.Running, Attempts = ProfileImportWorker.MaxAttempts };
            db.ProfileImportJobs.AddRange(retry, tooMany);
            await db.SaveChangesAsync();
            retryId = retry.Id;
            tooManyId = tooMany.Id;
        }
        var worker = new ProfileImportWorker(
            FunctionalTestSetup.ScopeFactory, NullLogger<ProfileImportWorker>.Instance);

        await worker.RecoverInterruptedAsync(default);

        var failed = await LoadAsync(tooManyId);
        failed.Status.ShouldBe(ProfileImportStatus.Failed);
        failed.Error.ShouldBe(ProfileImportWorker.RestartMessage);
        (await LoadAsync(retryId)).Status.ShouldNotBe(ProfileImportStatus.Running);
        // As at startup: recovery puts the work back, then the worker is woken.
        using (var scope = FunctionalTestSetup.ScopeFactory.CreateScope())
            scope.ServiceProvider.GetRequiredService<IProfileImportSignal>().Notify();
        await WaitForAsync(retryId, ProfileImportStatus.Completed);
    }

    [Test]
    public async Task ShouldOfferTheNewestUnfinishedImportToResumeUntilItIsSavedOrTooOld()
    {
        var (candidateId, cvId) = await UploadAsync();
        (await TestApp.SendAsync(new GetLatestProfileImportJobQuery(candidateId))).ShouldBeNull();

        var started = await TestApp.SendAsync(new StartProfileImportCommand(cvId));
        await WaitForAsync(started.Id, ProfileImportStatus.Completed);

        var resume = await TestApp.SendAsync(new GetLatestProfileImportJobQuery(candidateId));
        resume.ShouldNotBeNull();
        resume.Id.ShouldBe(started.Id);
        resume.Status.ShouldBe("Completed");
        resume.Result!.Headline.ShouldBe("Senior engineer");

        // Saving the reviewed result marks the job applied, so it is not offered again.
        await TestApp.SendAsync(new ImportProfileCommand { CandidateId = candidateId, CvId = cvId, Mode = "Merge" });
        (await TestApp.SendAsync(new GetLatestProfileImportJobQuery(candidateId))).ShouldBeNull();
        (await LoadAsync(started.Id)).AppliedAt.ShouldNotBeNull();
    }

    [Test]
    public async Task ShouldNotOfferAnImportThatIsOlderThanADayOrBelongsToAnotherCandidate()
    {
        var (candidateId, cvId) = await UploadAsync();
        var started = await TestApp.SendAsync(new StartProfileImportCommand(cvId));
        await WaitForAsync(started.Id, ProfileImportStatus.Completed);

        (await TestApp.SendAsync(new GetLatestProfileImportJobQuery(candidateId + 1000))).ShouldBeNull();

        using (var scope = FunctionalTestSetup.ScopeFactory.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            await db.ProfileImportJobs.IgnoreQueryFilters().Where(j => j.Id == started.Id)
                .ExecuteUpdateAsync(s => s.SetProperty(j => j.Created, DateTimeOffset.UtcNow.AddHours(-25)));
        }
        (await TestApp.SendAsync(new GetLatestProfileImportJobQuery(candidateId))).ShouldBeNull();
    }

    [Test]
    public async Task ShouldOfferAFailedImportToResumeToo()
    {
        FakeProfileImportAi.OnParse = _ => throw new AiServiceException(AiFailure.RateLimited, "busy");
        var (candidateId, cvId) = await UploadAsync();
        var started = await TestApp.SendAsync(new StartProfileImportCommand(cvId));
        await WaitForAsync(started.Id, ProfileImportStatus.Failed);

        var resume = await TestApp.SendAsync(new GetLatestProfileImportJobQuery(candidateId));

        resume!.Status.ShouldBe("Failed");
        resume.Error.ShouldBe("busy");
    }

    [Test]
    public async Task ShouldRemoveTheJobWithItsCv()
    {
        var (_, cvId) = await UploadAsync();
        var started = await TestApp.SendAsync(new StartProfileImportCommand(cvId));
        await WaitForAsync(started.Id, ProfileImportStatus.Completed);

        using (var scope = FunctionalTestSetup.ScopeFactory.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            await db.Cvs.IgnoreQueryFilters().Where(c => c.Id == cvId).ExecuteDeleteAsync();
            (await db.ProfileImportJobs.IgnoreQueryFilters().CountAsync(j => j.Id == started.Id)).ShouldBe(0);
        }
    }

    // The real endpoints, with the real sign-in: a short answer to the start and to every poll.
    [Test]
    public async Task ShouldStartAndPollThroughTheEndpointsOnlyWhenSignedIn()
    {
        var gate = new TaskCompletionSource<ParsedProfileDto>();
        FakeProfileImportAi.OnParse = _ => gate.Task;
        var (candidateId, cvId) = await UploadAsync();
        using (var scope = FunctionalTestSetup.ScopeFactory.CreateScope())
        {
            var users = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
            var user = (await users.FindByIdAsync(TestApp.GetUserId()!))!;
            user.EmailConfirmed = true;
            await users.UpdateAsync(user);
        }
        using var client = FunctionalTestSetup.Factory.CreateClient();
        (await client.PostAsJsonAsync("/api/CandidateProfiles/import-jobs", new { cvId })).StatusCode.ShouldBe(HttpStatusCode.Unauthorized);

        var login = await client.PostAsJsonAsync("/api/Users/login", new { email = "test@local", password = "Testing1234!" });
        login.EnsureSuccessStatusCode();
        var token = (await login.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("accessToken").GetString()!;
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        (await client.GetAsync($"/api/CandidateProfiles/import-jobs/latest?candidateId={candidateId}")).StatusCode.ShouldBe(HttpStatusCode.NoContent);

        var start = await client.PostAsJsonAsync("/api/CandidateProfiles/import-jobs", new { cvId });
        start.StatusCode.ShouldBe(HttpStatusCode.Accepted);
        var job = await start.Content.ReadFromJsonAsync<JsonElement>();
        job.GetProperty("status").GetString().ShouldBe("Pending");
        var id = job.GetProperty("id").GetInt32();

        gate.SetResult(FakeProfileImportAi.SampleProfile());
        await WaitForAsync(id, ProfileImportStatus.Completed);

        var poll = await client.GetFromJsonAsync<JsonElement>($"/api/CandidateProfiles/import-jobs/{id}");
        poll.GetProperty("status").GetString().ShouldBe("Completed");
        poll.GetProperty("result").GetProperty("headline").GetString().ShouldBe("Senior engineer");
        (await client.GetAsync($"/api/CandidateProfiles/import-jobs/latest?candidateId={candidateId}")).StatusCode.ShouldBe(HttpStatusCode.OK);
    }
}
