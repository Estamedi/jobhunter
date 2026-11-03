using backend.jobhunter.Application.Common.Interfaces;
using backend.jobhunter.Application.CvDrafts;
using backend.jobhunter.Infrastructure.CvImport;
using backend.jobhunter.Infrastructure.CvRendering;
using NUnit.Framework;
using Shouldly;

namespace backend.jobhunter.Application.UnitTests.Eval;

// The evaluation's own logic, run on canned CVs so it needs no AI.
public class CvEvalScoringTests
{
    private static string FixturesDir([System.Runtime.CompilerServices.CallerFilePath] string path = "")
        => Path.Combine(Path.GetDirectoryName(path)!, "Fixtures");

    private static CvEvalFixture Fixture(CvEvalFixture.FixtureExpect expect) => new()
    {
        Name = "canned",
        Header = new() { FullName = "Alex Example", Email = "alex@example.test", Phone = "+000", Location = "Testville" },
        Job = new() { Title = "DevOps Engineer", Description = "Terraform and Ansible." },
        Expect = expect,
    };

    private static GeneratedCvDto Cv(string summary = "Engineer with Terraform skills.", params string[] bullets) => new()
    {
        Headline = "DevOps Engineer | Terraform",
        Summary = summary,
        Skills = [new CvSkillGroupDto { Category = "DevOps", Items = ["Terraform", "Ansible"] }],
        Experience = [new CvExperienceDto { Role = "Lead", Company = "Acme", StartDate = "Jan 2022", Bullets = bullets.ToList() }],
    };

    private static async Task<string> AtsTextAsync(GeneratedCvDto cv)
    {
        var pdf = new QuestPdfCvRenderer().Render("classic", new CvHeaderDto("Alex Example", "alex@example.test", "+000", "Testville"), cv);
        using var stream = new MemoryStream(pdf);
        return await new CvTextExtractor().ExtractTextAsync(stream, "cv.pdf", default);
    }

    private static async Task<CvEvalRow> RunAsync(CvEvalFixture fixture, GeneratedCvDto cv, int grounding = 0, int copied = 0)
        => CvEvalScoring.Evaluate(fixture, cv, new CvBackground("Terraform, Ansible at Acme", null, []), grounding, copied, await AtsTextAsync(cv), 1);

    [Test]
    public async Task ShouldPassACleanCv()
    {
        var row = await RunAsync(Fixture(new() { RequireInText = ["Acme"] }), Cv(bullets: "Wrote Terraform modules for 3 environments at Acme."));

        row.FailedGates.ShouldBeEmpty();
        row.Passed.ShouldBeTrue();
    }

    [Test]
    public async Task ShouldFailOnGroundingAndCopiedText()
    {
        var row = await RunAsync(Fixture(new()), Cv(bullets: "Wrote Terraform modules."), grounding: 2, copied: 1);

        row.FailedGates.ShouldContain(g => g.StartsWith("grounding (2 issues)"));
        row.FailedGates.ShouldContain(g => g.StartsWith("copied from the job"));
    }

    [Test]
    public async Task ShouldFailOnAForbiddenWordInTextButAllowItInTheSkillsList()
    {
        var cv = Cv("Engineer.", "Ran workloads on Kubernetes at Acme.") with
        {
            Skills = [new CvSkillGroupDto { Category = "Currently learning", Items = ["Kubernetes"] }],
        };

        var row = await RunAsync(Fixture(new() { ForbidInText = ["Kubernetes"] }), cv);
        row.FailedGates.ShouldContain("forbidden in text: Kubernetes");

        var okCv = Cv("Engineer.", "Wrote Terraform modules at Acme.") with { Skills = cv.Skills };
        (await RunAsync(Fixture(new() { ForbidInText = ["Kubernetes"] }), okCv)).FailedGates.ShouldBeEmpty();
    }

    [Test]
    public async Task ShouldFailOnAForbiddenWordInABulletOnly()
    {
        var fixture = Fixture(new() { ForbidInBullets = ["Kotlin"] });

        (await RunAsync(fixture, Cv("Engineer who built a Kotlin app.", "Wrote Terraform modules at Acme."))).FailedGates.ShouldBeEmpty();
        (await RunAsync(fixture, Cv("Engineer.", "Built a Kotlin app at Acme."))).FailedGates.ShouldContain("forbidden in a bullet: Kotlin");
    }

    [Test]
    public async Task ShouldFailWhenTwoWordsShareASentence()
    {
        var fixture = Fixture(new() { ForbidPairs = [["chatbot", "OpenAI"]] });

        var apart = Cv("Built a chatbot. Also used OpenAI for invoices.", "Delivered the chatbot at Acme.", "Sent invoices to the OpenAI API.");
        (await RunAsync(fixture, apart)).FailedGates.ShouldBeEmpty();

        var together = Cv("Engineer.", "Delivered the chatbot powered by OpenAI at Acme.");
        (await RunAsync(fixture, together)).FailedGates.ShouldContain(g => g.StartsWith("wrong attribution"));
    }

    [Test]
    public async Task ShouldAcceptARequiredEmployerThatIsOnlyInTheEntryHeading()
    {
        var row = await RunAsync(Fixture(new() { RequireInText = ["Acme"] }), Cv(bullets: "Wrote Terraform modules for 3 environments."));

        row.FailedGates.ShouldBeEmpty();
    }

    [Test]
    public async Task ShouldFailWhenARequiredWordIsMissing()
    {
        var row = await RunAsync(Fixture(new() { RequireInText = ["Globex"] }), Cv(bullets: "Wrote Terraform modules at Acme."));

        row.FailedGates.ShouldContain("missing: Globex");
    }

    [Test]
    public void ShouldFlagAnAtsTextWithTheHeadingsOutOfOrderOrTheNameBuried()
    {
        var cv = Cv(bullets: "Wrote Terraform modules.");

        CvEvalScoring.AtsProblems(cv, "Alex Example", "alex@example.test",
            "Alex Example alex@example.test Summary Technical Skills Professional Experience").ShouldBeEmpty();
        CvEvalScoring.AtsProblems(cv, "Alex Example", "alex@example.test",
            "Alex Example alex@example.test Professional Experience Technical Skills Summary")
            .ShouldContain("ATS: headings are out of order");
        CvEvalScoring.AtsProblems(cv, "Alex Example", "alex@example.test",
            "Summary Technical Skills Professional Experience Alex Example alex@example.test")
            .ShouldContain("ATS: the name is not at the top");
    }

    [Test]
    public async Task ShouldMeasureMustHaveCoverageInTextAndInSkillsOnly()
    {
        var fixture = Fixture(new()
        {
            MustHave = [new() { Name = "Terraform" }, new() { Name = "Ansible" }, new() { Name = "Kubernetes" }],
        });

        var row = await RunAsync(fixture, Cv("Engineer.", "Wrote Terraform modules at Acme."));

        row.Metrics.MustHaveTotal.ShouldBe(3);
        row.Metrics.MustHaveInText.ShouldBe(1);
        row.Metrics.MustHaveSkillsOnly.ShouldBe(1);
        row.Metrics.HeadlineHasJobTitle.ShouldBeTrue();
        row.Metrics.SkillCount.ShouldBe(2);
    }

    [Test]
    public void ShouldLoadEveryFixtureAndTurnItIntoProfileRows()
    {
        var files = Directory.GetFiles(FixturesDir(), "*.json");
        files.Length.ShouldBeGreaterThanOrEqualTo(6);

        foreach (var file in files)
        {
            var fixture = CvEvalFixture.Load(file);
            var name = Path.GetFileNameWithoutExtension(file);
            fixture.Name.ShouldBe(name);
            fixture.Job.Description.ShouldNotBeNullOrWhiteSpace();
            fixture.Expect.MustHave.ShouldNotBeEmpty(name);
            fixture.Expect.ForbidPairs.ShouldAllBe(p => p.Count == 2, name);

            var profile = fixture.ToProfile();
            profile.Experiences.ShouldNotBeEmpty(name);
            profile.Experiences.Select(e => e.Id).Distinct().Count().ShouldBe(profile.Experiences.Count);
            CvBackgroundBuilder.Build(profile, null).ShouldNotBeNull();
        }
    }

    [Test]
    public void ShouldChangeThePromptShaWhenAPromptChanges()
    {
        CvEvalReport.PromptSha().ShouldNotBeNullOrEmpty();
        CvEvalReport.PromptSha().ShouldBe(CvEvalReport.PromptSha());
    }

    [Test]
    public void ShouldPrintTheTableAndTheChangeFromTheBaseline()
    {
        var metrics = new CvEvalMetrics { Score = 90, MustHaveTotal = 4, MustHaveInText = 3, SkillCount = 18, Words = 700 };
        var rows = new List<CvEvalRow>
        {
            new("good", [], metrics),
            new("bad", ["grounding (1 issue)"], metrics with { Score = 70 }),
            new("broken", [], new CvEvalMetrics(), "timeout"),
        };
        var baseline = new CvEvalBaseline { Model = "m", PromptSha = "abc", Rows = new() { ["good"] = metrics with { Score = 85 } } };

        var markdown = CvEvalReport.Markdown("m", rows, baseline);

        markdown.ShouldContain("| good | PASS | 90 |");
        markdown.ShouldContain("| bad | FAIL: grounding (1 issue) | 70 |");
        markdown.ShouldContain("| broken | ERROR: timeout");
        markdown.ShouldContain("good: score 90 (+5)");
        markdown.ShouldContain("bad: new fixture, no baseline");
    }
}
