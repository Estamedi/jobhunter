using backend.jobhunter.Application.Common.Exceptions;
using backend.jobhunter.Application.Common.Interfaces;
using backend.jobhunter.Application.CvDrafts;
using backend.jobhunter.Application.CvDrafts.Commands.ExportCvDraft;
using backend.jobhunter.Application.CvDrafts.Commands.GenerateCvDraft;
using backend.jobhunter.Application.CvDrafts.Commands.RegenerateCvDraftSection;
using backend.jobhunter.Application.CvDrafts.Commands.RetryCvDraftGeneration;
using backend.jobhunter.Application.CvDrafts.Commands.UpdateCvDraft;
using backend.jobhunter.Application.CvDrafts.Queries.GetCvDraft;
using backend.jobhunter.Domain.Entities;
using backend.jobhunter.Domain.Enums;
using backend.jobhunter.Infrastructure.CvGeneration;
using backend.jobhunter.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using ValidationException = backend.jobhunter.Application.Common.Exceptions.ValidationException;

namespace backend.jobhunter.Application.FunctionalTests.CvGeneration;

public class CvDraftGenerationTests : TestBase
{
    private static readonly TimeSpan Wait = TimeSpan.FromSeconds(30);

    [SetUp]
    public void ResetFakes()
    {
        FakeCvAi.Reset();
        lock (CapturingNotifier.Sent) CapturingNotifier.Sent.Clear();
    }

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

    private static GenerateCvDraftCommand Request(int candidateId, string? jobDescription = "Build things with Terraform.")
        => new() { CandidateId = candidateId, JobTitle = "DevOps Engineer", JobDescription = jobDescription };

    private static async Task<CvDraft> LoadAsync(int id)
    {
        using var scope = FunctionalTestSetup.ScopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        return await db.CvDrafts.IgnoreQueryFilters().AsNoTracking().SingleAsync(d => d.Id == id);
    }

    private static async Task<CvDraft> WaitForAsync(int id, CvDraftStatus status)
    {
        var deadline = DateTime.UtcNow + Wait;
        while (DateTime.UtcNow < deadline)
        {
            var draft = await LoadAsync(id);
            if (draft.Status == status) return draft;
            await Task.Delay(100);
        }
        var last = await LoadAsync(id);
        throw new TimeoutException($"Draft {id} was {last.Status}, expected {status}. Error: {last.GenerationError}");
    }

    private static async Task<int> InsertDraftAsync(CvDraftStatus status, int attempts = 0, string content = "{}")
    {
        var candidateId = await CreateCandidateAsync();
        using var scope = FunctionalTestSetup.ScopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var draft = new CvDraft
        {
            CandidateId = candidateId, Title = "CV", JobTitle = "Engineer", ContentJson = content,
            Status = status, GenerationAttempts = attempts,
        };
        db.CvDrafts.Add(draft);
        await db.SaveChangesAsync();
        return draft.Id;
    }

    [Test]
    public async Task ShouldAcceptTheRequestAtOnceAsAPendingDraftWithoutWaitingForTheAi()
    {
        var gate = new TaskCompletionSource<GeneratedCvDto>();
        FakeCvAi.OnGenerate = _ => gate.Task;
        var candidateId = await CreateCandidateAsync();

        var created = await TestApp.SendAsync(Request(candidateId, jobDescription: null));

        created.Status.ShouldBe("Pending");
        created.Content.Summary.ShouldBeEmpty();
        created.Warnings!.ShouldContain(w => w.Contains("No job description"));
        gate.SetResult(FakeCvAi.SampleCv());
        await WaitForAsync(created.Id, CvDraftStatus.Completed);
    }

    [Test]
    public async Task ShouldWriteTheDraftInTheBackgroundThenTellTheOwner()
    {
        var candidateId = await CreateCandidateAsync();

        var created = await TestApp.SendAsync(Request(candidateId));
        var draft = await WaitForAsync(created.Id, CvDraftStatus.Completed);

        CvDraftContent.Deserialize(draft.ContentJson).Summary.ShouldBe("Lead engineer with 12 years of delivery.");
        draft.GenerationError.ShouldBeNull();
        var read = await TestApp.SendAsync(new GetCvDraftQuery(created.Id));
        read.Status.ShouldBe("Completed");
        read.Content.Summary.ShouldNotBeEmpty();

        var owner = TestApp.GetUserId()!;
        var deadline = DateTime.UtcNow + Wait;
        while (DateTime.UtcNow < deadline)
        {
            lock (CapturingNotifier.Sent)
            {
                if (CapturingNotifier.Sent.Contains((owner, created.Id, "Completed"))) return;
            }
            await Task.Delay(100);
        }
        Assert.Fail("The owner was not told the draft was ready.");
    }

    [Test]
    public async Task ShouldFailWithTheAiMessageWhenTheProviderFailsAndAGenericOneForAnythingElse()
    {
        var candidateId = await CreateCandidateAsync();

        FakeCvAi.OnGenerate = _ => throw new AiServiceException(AiFailure.RateLimited, "The AI service is busy. Try again in a minute.");
        var rateLimited = await TestApp.SendAsync(Request(candidateId));
        var failed = await WaitForAsync(rateLimited.Id, CvDraftStatus.Failed);
        failed.GenerationError.ShouldBe("The AI service is busy. Try again in a minute.");

        FakeCvAi.OnGenerate = _ => throw new InvalidOperationException("secret connection string leaked");
        var broken = await TestApp.SendAsync(Request(candidateId));
        var generic = await WaitForAsync(broken.Id, CvDraftStatus.Failed);
        generic.GenerationError.ShouldBe(CvGenerationWorker.GenericFailureMessage);
        generic.GenerationError!.ShouldNotContain("secret");

        var read = await TestApp.SendAsync(new GetCvDraftQuery(broken.Id));
        read.Error.ShouldBe(CvGenerationWorker.GenericFailureMessage);
    }

    [Test]
    public async Task ShouldRetryAFailedDraftAndWriteItTheSecondTime()
    {
        var candidateId = await CreateCandidateAsync();
        FakeCvAi.OnGenerate = _ => throw new AiServiceException(AiFailure.Unavailable, "The AI service is down.");
        var created = await TestApp.SendAsync(Request(candidateId));
        await WaitForAsync(created.Id, CvDraftStatus.Failed);

        FakeCvAi.OnGenerate = null;
        var retried = await TestApp.SendAsync(new RetryCvDraftGenerationCommand(created.Id));

        retried.Status.ShouldBe("Pending");
        retried.Error.ShouldBeNull();
        await WaitForAsync(created.Id, CvDraftStatus.Completed);
    }

    [Test]
    public async Task ShouldOnlyRetryAFailedDraft()
    {
        var running = await InsertDraftAsync(CvDraftStatus.Running);

        await Should.ThrowAsync<ValidationException>(() => TestApp.SendAsync(new RetryCvDraftGenerationCommand(running)));
    }

    [Test]
    public async Task ShouldRefuseToEditOrExportADraftThatIsNotCompleted()
    {
        var running = await InsertDraftAsync(CvDraftStatus.Running);
        var failed = await InsertDraftAsync(CvDraftStatus.Failed);

        var stillWriting = await Should.ThrowAsync<ValidationException>(() => TestApp.SendAsync(new UpdateCvDraftCommand
        {
            Id = running, Title = "CV", TemplateId = "classic", Content = new GeneratedCvDto(),
        }));
        stillWriting.Errors.Values.SelectMany(v => v).ShouldContain(m => m.Contains("still being written"));

        var couldNot = await Should.ThrowAsync<ValidationException>(() => TestApp.SendAsync(new ExportCvDraftCommand(failed)));
        couldNot.Errors.Values.SelectMany(v => v).ShouldContain(m => m.Contains("could not be written"));
    }

    [Test]
    public async Task ShouldReadDraftsMadeBeforeStatusExistedAsCompleted()
    {
        var id = await InsertDraftAsync(CvDraftStatus.Completed, content: """{"summary":"Old CV"}""");

        var read = await TestApp.SendAsync(new GetCvDraftQuery(id));

        read.Status.ShouldBe("Completed");
        new CvDraft().Status.ShouldBe(CvDraftStatus.Completed);
    }

    [Test]
    public async Task ShouldKeepWorkingAfterADraftIsDeletedWhileItIsBeingWritten()
    {
        var gate = new TaskCompletionSource<GeneratedCvDto>();
        var started = new TaskCompletionSource();
        FakeCvAi.OnGenerate = request =>
        {
            if (request.JobTitle == "First")
            {
                started.TrySetResult();
                return gate.Task;
            }
            return Task.FromResult(FakeCvAi.SampleCv());
        };
        var candidateId = await CreateCandidateAsync();
        var first = await TestApp.SendAsync(Request(candidateId) with { JobTitle = "First" });
        await started.Task.WaitAsync(Wait);

        using (var scope = FunctionalTestSetup.ScopeFactory.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            await db.CvDrafts.IgnoreQueryFilters().Where(d => d.Id == first.Id).ExecuteDeleteAsync();
        }
        gate.SetResult(FakeCvAi.SampleCv());

        var second = await TestApp.SendAsync(Request(candidateId) with { JobTitle = "Second" });
        await WaitForAsync(second.Id, CvDraftStatus.Completed);
    }

    [Test]
    public async Task ShouldPutInterruptedDraftsBackInTheQueueOrFailThemAfterTooManyTries()
    {
        var retry = await InsertDraftAsync(CvDraftStatus.Running, attempts: 1);
        var tooMany = await InsertDraftAsync(CvDraftStatus.Running, attempts: CvGenerationWorker.MaxAttempts);
        var worker = new CvGenerationWorker(
            FunctionalTestSetup.ScopeFactory, new CvGenerationSignal(), NullLogger<CvGenerationWorker>.Instance);

        await worker.RecoverInterruptedAsync(default);

        var failed = await LoadAsync(tooMany);
        failed.Status.ShouldBe(CvDraftStatus.Failed);
        failed.GenerationError.ShouldBe(CvGenerationWorker.RestartMessage);
        (await LoadAsync(retry)).Status.ShouldNotBe(CvDraftStatus.Running);
        await WaitForAsync(retry, CvDraftStatus.Completed);
    }

    [Test]
    public async Task ShouldWriteADraftFromTheOwnersProfileEvenWhenAnotherUserIsSignedInElsewhere()
    {
        // User A owns the profile and the draft; the draft failed earlier.
        await TestApp.RunAsUserAsync("owner-a@local", "Testing1234!", []);
        int candidateId, draftId;
        using (var scope = FunctionalTestSetup.ScopeFactory.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var candidate = new Candidate { FullName = "Jane Sample", Email = "jane@example.com" };
            db.Candidates.Add(candidate);
            await db.SaveChangesAsync();
            db.CandidateProfiles.Add(new CandidateProfile
            {
                CandidateId = candidate.Id,
                Experiences = { new ProfileExperience { Title = "Lead", Company = "OwnerAOnlyCompany", StartDate = new DateOnly(2022, 1, 1), IsCurrent = true } },
            });
            var draft = new CvDraft { CandidateId = candidate.Id, Title = "CV", JobTitle = "Engineer", ContentJson = "{}", Status = CvDraftStatus.Failed };
            db.CvDrafts.Add(draft);
            await db.SaveChangesAsync();
            candidateId = candidate.Id;
            draftId = draft.Id;
        }
        _ = candidateId;

        // User B is the current test user now, so only the worker's switch to the draft's owner can find A's data.
        await TestApp.RunAsUserAsync("other-b@local", "Testing1234!", []);
        using (var scope = FunctionalTestSetup.ScopeFactory.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            await db.CvDrafts.IgnoreQueryFilters().Where(d => d.Id == draftId)
                .ExecuteUpdateAsync(s => s.SetProperty(d => d.Status, CvDraftStatus.Pending));
            scope.ServiceProvider.GetRequiredService<ICvGenerationSignal>().Notify();
        }

        await WaitForAsync(draftId, CvDraftStatus.Completed);
        FakeCvAi.LastRequest!.BackgroundText.ShouldNotBeNull().ShouldContain("OwnerAOnlyCompany");
    }

    [Test]
    public async Task ShouldReadTheJobRequirementsFirstKeepThemOnTheDraftAndGiveThemToTheWriter()
    {
        var candidateId = await CreateCandidateAsync();
        FakeCvAi.OnExtract = _ => Task.FromResult(new JobRequirementsDto
        {
            MustHave = [new JobRequirementDto { Name = "Terraform" }],
            NiceToHave = [new JobRequirementDto { Name = "Go" }],
        });

        var created = await TestApp.SendAsync(Request(candidateId));
        var draft = await WaitForAsync(created.Id, CvDraftStatus.Completed);

        FakeCvAi.LastRequest!.Requirements!.MustHave.Select(r => r.Name).ShouldBe(["Terraform"]);
        FakeCvAi.LastRequest.Requirements.NiceToHave.Select(r => r.Name).ShouldBe(["Go"]);
        draft.JobRequirementsJson!.ShouldContain("Terraform");
    }

    [Test]
    public async Task ShouldNotReadTheJobRequirementsAgainWhenTheDraftAlreadyHasThem()
    {
        var candidateId = await CreateCandidateAsync();
        FakeCvAi.OnExtract = _ => Task.FromResult(new JobRequirementsDto { MustHave = [new JobRequirementDto { Name = "Terraform" }] });
        FakeCvAi.OnGenerate = _ => throw new AiServiceException(AiFailure.Unavailable, "The AI service is down.");
        var created = await TestApp.SendAsync(Request(candidateId));
        await WaitForAsync(created.Id, CvDraftStatus.Failed);
        FakeCvAi.ExtractCalls.ShouldBe(1);

        FakeCvAi.OnGenerate = null;
        await TestApp.SendAsync(new RetryCvDraftGenerationCommand(created.Id));
        await WaitForAsync(created.Id, CvDraftStatus.Completed);

        FakeCvAi.ExtractCalls.ShouldBe(1);
    }

    [Test]
    public async Task ShouldStillWriteTheCvWhenTheJobRequirementsCannotBeRead()
    {
        var candidateId = await CreateCandidateAsync();
        FakeCvAi.OnExtract = _ => throw new InvalidOperationException("extraction failed");

        var created = await TestApp.SendAsync(Request(candidateId));
        var draft = await WaitForAsync(created.Id, CvDraftStatus.Completed);

        FakeCvAi.LastRequest!.Requirements.ShouldBeNull();
        draft.JobRequirementsJson.ShouldBeNull();
    }

    [Test]
    public async Task ShouldNotReadRequirementsForACvWithoutAJobDescription()
    {
        var candidateId = await CreateCandidateAsync();

        var created = await TestApp.SendAsync(Request(candidateId, jobDescription: null));
        await WaitForAsync(created.Id, CvDraftStatus.Completed);

        FakeCvAi.ExtractCalls.ShouldBe(0);
        FakeCvAi.LastRequest!.Requirements.ShouldBeNull();
    }

    [Test]
    public async Task ShouldNameTheDraftAfterTheJobAndTheCompanyOfItsApplication()
    {
        var candidateId = await CreateCandidateAsync();
        int applicationId;
        using (var scope = FunctionalTestSetup.ScopeFactory.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var company = new JobCompany { Name = "Globex" };
            var role = new JobRole { Title = "DevOps Engineer", Company = company };
            var application = new JobApplication { CandidateId = candidateId, JobRole = role, Company = company };
            db.Applications.Add(application);
            await db.SaveChangesAsync();
            applicationId = application.Id;
        }

        var fromApplication = await TestApp.SendAsync(Request(candidateId) with { JobApplicationId = applicationId });
        var general = await TestApp.SendAsync(Request(candidateId));
        var named = await TestApp.SendAsync(Request(candidateId) with { Title = "My own name" });

        fromApplication.Title.ShouldBe("DevOps Engineer - Globex");
        general.Title.ShouldBe("DevOps Engineer");
        named.Title.ShouldBe("My own name");
    }

    [Test]
    public async Task ShouldRunTheHeadlineSkillsCopyAndKeywordChecksWhenASectionIsRewritten()
    {
        var candidateId = await CreateCandidateAsync();
        const string job = "We need someone who writes Terraform every day and keeps the platform running smoothly for all teams.";
        int id;
        using (var scope = FunctionalTestSetup.ScopeFactory.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var draft = new CvDraft
            {
                CandidateId = candidateId, Title = "CV", JobTitle = "Engineer", JobDescription = job,
                ContentJson = CvDraftContent.Serialize(new GeneratedCvDto { Headline = "Engineer", Summary = "Old." }),
                JobRequirementsJson = """{"mustHave":[{"name":"Terraform","aliases":[]}],"niceToHave":[],"otherRequirements":[]}""",
                Status = CvDraftStatus.Completed,
            };
            db.CvDrafts.Add(draft);
            await db.SaveChangesAsync();
            id = draft.Id;
        }
        FakeCvAi.OnRefine = _ => new GeneratedCvDto
        {
            Headline = "Platform Engineer | Terraform | Go",
            Summary = string.Join(' ', Enumerable.Repeat("Writes Terraform.", 8)) + " We need someone who writes Terraform every day and keeps the platform running smoothly for all teams.",
            Skills = [new CvSkillGroupDto { Category = "Cloud", Items = Enumerable.Range(1, 30).Select(i => $"Tool {i}").ToList() }],
        };

        var headline = await TestApp.SendAsync(new RegenerateCvDraftSectionCommand { Id = id, Section = "headline", Instruction = "x" });
        var summary = await TestApp.SendAsync(new RegenerateCvDraftSectionCommand { Id = id, Section = "summary", Instruction = "x" });
        var skills = await TestApp.SendAsync(new RegenerateCvDraftSectionCommand { Id = id, Section = "skills", Instruction = "x" });

        headline.Content.Headline.ShouldBe("Platform Engineer");
        summary.Warnings!.ShouldContain(w => w.Contains("copied from the job description"));
        summary.Warnings!.ShouldContain(w => w.Contains("\"Terraform\" is used"));
        skills.Content.Skills.Sum(g => g.Items.Count).ShouldBe(20);
    }
}
