using backend.jobhunter.Application.Common.Interfaces;
using backend.jobhunter.Application.CvDrafts;
using NUnit.Framework;
using Shouldly;

namespace backend.jobhunter.Application.UnitTests.CvDrafts;

public class CvDraftImproverTests
{
    private const string Background = "- Technical Lead at Acme | Jan 2022 - Present\n  Cut cloud costs by 30% across 12 services.";

    private static CvBackground BackgroundWithNoProfile() => new(Background, null, []);

    private static GeneratedCvDto Cv(string bullet, string company = "Acme") => new()
    {
        Summary = "Lead engineer.",
        Experience = [new CvExperienceDto { Role = "Technical Lead", Company = company, Bullets = [bullet] }],
    };

    private sealed class FakeAi(params GeneratedCvDto[] results) : ICvGenerationAiService
    {
        private readonly Queue<GeneratedCvDto> _results = new(results);
        public int Calls { get; private set; }
        public string? LastInstructions { get; private set; }

        public Task<GeneratedCvDto> GenerateAsync(CvGenerationRequest request, CancellationToken cancellationToken)
        {
            Calls++;
            LastInstructions = request.Instructions;
            return Task.FromResult(_results.Dequeue());
        }

        public Task<JobRequirementsDto> ExtractRequirementsAsync(string jobDescription, CancellationToken cancellationToken)
            => throw new NotSupportedException();

        public Task<GeneratedCvDto> RefineSectionAsync(CvSectionRefineRequest request, CancellationToken cancellationToken)
            => throw new NotSupportedException();
    }

    private static CvGenerationRequest Request() => new() { FullName = "Jane", JobTitle = "Engineer" };

    [Test]
    public async Task ShouldNotCallTheAiAgainWhenTheFirstDraftIsClean()
    {
        var ai = new FakeAi();
        var first = Cv("Cut cloud costs by 30% across 12 services.") with
        {
            Experience =
            [
                new CvExperienceDto
                {
                    Role = "Technical Lead", Company = "Acme", StartDate = "Jan 2022", EndDate = "Present",
                    Bullets = ["Cut cloud costs by 30% across 12 services.", "Led the platform team through two cloud migrations and kept every release on schedule.", "Wrote the release checklist that the whole engineering group still follows for each deploy."],
                },
            ],
        };

        var result = await CvDraftImprover.ImproveAsync(ai, Request(), first, BackgroundWithNoProfile(), default);

        ai.Calls.ShouldBe(0);
        result.GroundingIssues.ShouldBe(0);
    }

    [Test]
    public async Task ShouldRetryOnceWithTheGroundingProblemsAndKeepTheFixedDraft()
    {
        var ai = new FakeAi(Cv("Cut cloud costs by 30% across 12 services."));
        var first = Cv("Cut cloud costs by 80% across 12 services.", company: "Initech");

        var result = await CvDraftImprover.ImproveAsync(ai, Request(), first, BackgroundWithNoProfile(), default);

        ai.Calls.ShouldBe(1);
        ai.LastInstructions!.ShouldContain("Initech");
        result.GroundingIssues.ShouldBe(0);
        result.Cv.Experience[0].Company.ShouldBe("Acme");
    }

    [Test]
    public async Task ShouldNotKeepARetryThatInventsAFigureEvenIfItReadsBetter()
    {
        // The first draft only has a weak verb. The retry fixes the verb but adds a figure that is not
        // in the background, so the first draft must be kept.
        var ai = new FakeAi(Cv("Cut cloud costs by 95% across 12 services."));
        var first = Cv("Helped cut cloud costs by 30% across 12 services.");

        var result = await CvDraftImprover.ImproveAsync(ai, Request(), first, BackgroundWithNoProfile(), default);

        ai.Calls.ShouldBe(1);
        result.Cv.Experience[0].Bullets[0].ShouldStartWith("Helped");
        result.Warnings.ShouldNotContain(w => w.Contains("95%"));
    }

    [Test]
    public async Task ShouldReportOnlyTheWarningsOfTheDraftThatWasKept()
    {
        var ai = new FakeAi(Cv("Cut cloud costs by 30% across 12 services.", company: "Globex"));
        var first = Cv("Cut cloud costs by 30% across 12 services.", company: "Initech");

        var result = await CvDraftImprover.ImproveAsync(ai, Request(), first, BackgroundWithNoProfile(), default);

        // Both drafts have one unknown employer, so the tie falls to the writing score and the first stays.
        result.Cv.Experience[0].Company.ShouldBe("Initech");
        result.Warnings.Count(w => w.Contains("employer")).ShouldBe(1);
        result.Warnings.ShouldNotContain(w => w.Contains("Globex"));
    }

    private static CvGeneratedAlias Rich(string summary, params string[] bullets) => new(summary, bullets);

    private sealed record CvGeneratedAlias(string Summary, string[] Bullets)
    {
        public GeneratedCvDto ToCv() => new()
        {
            Summary = Summary,
            Experience =
            [
                new CvExperienceDto
                {
                    Role = "Technical Lead", Company = "Acme", StartDate = "Jan 2022", EndDate = "Present",
                    Bullets = Bullets.ToList(),
                },
            ],
        };
    }

    private static readonly string[] GoodBullets =
    [
        "Cut cloud costs by 30% across 12 services.",
        "Led the platform team through two cloud migrations and kept every release on schedule.",
        "Wrote the release checklist that the whole engineering group still follows for each deploy.",
    ];

    [Test]
    public async Task ShouldRetryWhenTheSummaryUsesAPronounAndNameItInTheInstructions()
    {
        var ai = new FakeAi(Rich("Lead engineer with 12 years of delivery.", GoodBullets).ToCv());
        var first = Rich("He leads a platform team.", GoodBullets).ToCv();

        var result = await CvDraftImprover.ImproveAsync(ai, Request(), first, BackgroundWithNoProfile(), default);

        ai.Calls.ShouldBe(1);
        ai.LastInstructions!.ShouldContain("pronoun \"he\"");
        result.Cv.Summary.ShouldStartWith("Lead engineer");
    }

    [Test]
    public async Task ShouldWarnAboutACopiedSentenceAndPreferTheRetryThatDoesNotCopy()
    {
        const string job = "You will build CI/CD pipelines, manage infrastructure as code with Terraform, automate configuration with Ansible, and run containers on Docker.";
        var copied = Rich("Lead engineer.", "Built CI/CD pipelines, manage infrastructure as code with Terraform, automate configuration with Ansible, and run containers on Docker.", GoodBullets[1], GoodBullets[2]).ToCv();
        var ai = new FakeAi(Rich("Lead engineer.", GoodBullets).ToCv());

        var kept = await CvDraftImprover.ImproveAsync(ai, Request() with { JobDescription = job }, copied, BackgroundWithNoProfile(), default);

        ai.Calls.ShouldBe(1);
        ai.LastInstructions!.ShouldContain("Copied from the job description");
        kept.CopiedRuns.ShouldBe(0);
        kept.Warnings.ShouldNotContain(w => w.Contains("copied from the job description"));
    }

    [Test]
    public async Task ShouldShowACopiedSentenceWarningWhenTheRetryStillCopies()
    {
        const string job = "You will build CI/CD pipelines, manage infrastructure as code with Terraform, automate configuration with Ansible, and run containers on Docker.";
        var copied = Rich("Lead engineer.", "Built CI/CD pipelines, manage infrastructure as code with Terraform, automate configuration with Ansible, and run containers on Docker.", GoodBullets[1], GoodBullets[2]).ToCv();
        var ai = new FakeAi(copied);

        var result = await CvDraftImprover.ImproveAsync(ai, Request() with { JobDescription = job }, copied, BackgroundWithNoProfile(), default);

        result.Warnings.ShouldContain(w => w.Contains("copied from the job description"));
    }

    private static GeneratedCvDto Stuffed(int times) => new()
    {
        Summary = "Lead engineer.",
        Experience =
        [
            new CvExperienceDto
            {
                Role = "Technical Lead", Company = "Acme", StartDate = "Jan 2022", EndDate = "Present",
                Bullets = Enumerable.Range(0, times).Select(i => $"Cut cloud costs by 30% across 12 services using Terraform module {i}.").ToList(),
            },
        ],
    };

    private static CvGenerationRequest RequestNeeding(string keyword) => Request() with
    {
        Requirements = new JobRequirementsDto { MustHave = [new JobRequirementDto { Name = keyword }] },
    };

    [Test]
    public async Task ShouldRetryWhenAJobKeywordIsUsedMoreOftenThanTheCapAndKeepTheDraftThatUsesItLess()
    {
        var ai = new FakeAi(Stuffed(4));

        var result = await CvDraftImprover.ImproveAsync(ai, RequestNeeding("Terraform"), Stuffed(9), BackgroundWithNoProfile(), default);

        ai.Calls.ShouldBe(1);
        ai.LastInstructions!.ShouldContain("The keyword \"Terraform\" is used 9 times");
        result.KeywordRepeats.ShouldBe(0);
        result.Cv.Experience[0].Bullets.Count.ShouldBe(4);
    }

    [Test]
    public async Task ShouldNotLetAKeywordFixBeatAnInventedFact()
    {
        var invented = Stuffed(4) with
        {
            Experience = [Stuffed(4).Experience[0] with { Company = "Initech" }],
        };
        var ai = new FakeAi(invented);

        var result = await CvDraftImprover.ImproveAsync(ai, RequestNeeding("Terraform"), Stuffed(9), BackgroundWithNoProfile(), default);

        ai.Calls.ShouldBe(1);
        result.Cv.Experience[0].Bullets.Count.ShouldBe(9);
    }

    [Test]
    public async Task ShouldNotRetryForKeywordsWhenThereAreNoRequirements()
    {
        var ai = new FakeAi();
        var clean = Stuffed(3) with
        {
            Experience =
            [
                Stuffed(3).Experience[0] with
                {
                    Bullets = ["Cut cloud costs by 30% across 12 services.", "Led the platform team through two cloud migrations and kept every release on schedule.", "Wrote the release checklist that the whole engineering group still follows for each deploy."],
                },
            ],
        };

        var result = await CvDraftImprover.ImproveAsync(ai, Request(), clean, BackgroundWithNoProfile(), default);

        ai.Calls.ShouldBe(0);
        result.KeywordRepeats.ShouldBe(0);
    }
}
