using backend.jobhunter.Application.Common.Interfaces;
using backend.jobhunter.Application.CvDrafts;
using NUnit.Framework;
using Shouldly;

namespace backend.jobhunter.Application.UnitTests.CvDrafts;

public class CvScorerTests
{
    private static CvExperienceDto Role(string role, string start, string? end, params string[] bullets) => new()
    {
        Role = role, Company = "Acme", StartDate = start, EndDate = end, Bullets = bullets.ToList(),
    };

    private static GeneratedCvDto Cv(params CvExperienceDto[] roles) => new()
    {
        Headline = "AI Engineer",
        Summary = "Engineer who ships.",
        Skills = [new CvSkillGroupDto { Category = "Tech", Items = ["C#", ".NET", "SQL", "Docker", "Git", "Azure", "Python", "Redis"] }],
        Experience = roles.ToList(),
    };

    private static CvScoreCheckDto Check(CvScoreDto s, string id) => s.Checks.Single(c => c.Id == id);

    [Test]
    public void StrongCvScoresHigh()
    {
        var cv = Cv(
            Role("Lead", "Jan 2024", "Present",
                "Cut deployment time by 40% across 12 services using Docker pipelines",
                "Led a team of 6 engineers to deliver the billing platform in 5 months",
                "Designed a caching layer that handled 2M requests per day"));

        var score = CvScorer.Score(cv);

        score.Overall.ShouldBeGreaterThanOrEqualTo(90);
        score.Checks.ShouldAllBe(c => c.Score >= 9);
    }

    [Test]
    public void QuantifyCountsBulletsWithNumbers()
    {
        var cv = Cv(Role("Lead", "Jan 2024", "Present",
            "Cut deployment time by 40% with Docker pipelines",
            "Built the reporting module for the finance team",
            "Wrote the onboarding documentation for new staff"));

        var q = Check(CvScorer.Score(cv), "quantify");

        q.Detail.ShouldBe("1 of 3 bullets quantified");
        q.Score.ShouldBe(6);
        q.Issues.Single().Locations.Count.ShouldBe(2);
    }

    [Test]
    public void RepetitionFlagsAVerbUsedMoreThanTwice()
    {
        var cv = Cv(Role("Lead", "Jan 2024", "Present",
            "Built a thing with 3 parts", "Built another thing with 4 parts", "Built a third thing with 5 parts"));

        var r = Check(CvScorer.Score(cv), "repetition");

        r.Score.ShouldBeLessThan(10);
        r.Issues.Single().Message.ShouldContain("built");
        r.Issues.Single().Locations.Count.ShouldBe(3);
    }

    [Test]
    public void BoldMarkersDoNotHideAVerb()
    {
        var cv = Cv(Role("Lead", "Jan 2024", "Present",
            "**Built** a thing with 3 parts", "Built another thing with 4 parts", "Built a third thing with 5 parts"));

        Check(CvScorer.Score(cv), "repetition").Issues.ShouldNotBeEmpty();
    }

    [Test]
    public void WeakOpenersAndThinRecentRolesAreFlagged()
    {
        var cv = Cv(Role("Lead", "Jan 2024", "Present", "Responsible for the billing platform and its releases"));

        var w = Check(CvScorer.Score(cv), "weak-roles");

        w.Issues.Count.ShouldBe(2);
        w.Score.ShouldBeLessThan(10);
    }

    [Test]
    public void BuzzwordsAreFlagged()
    {
        var cv = Cv(Role("Lead", "Jan 2024", "Present", "Team player who cut costs by 20% across 3 teams"));

        Check(CvScorer.Score(cv), "buzzwords").Issues.ShouldNotBeEmpty();
    }

    [Test]
    public void DatesFlagEndBeforeStartAndGaps()
    {
        var cv = Cv(
            Role("New", "Jan 2024", "Present", "Cut costs by 20% across 3 teams in a year"),
            Role("Old", "Jan 2018", "Mar 2020", "Cut costs by 20% across 3 teams in a year"),
            Role("Backwards", "Jun 2015", "Jan 2015", "Cut costs by 20% across 3 teams in a year"));

        var d = Check(CvScorer.Score(cv), "dates");

        d.Issues.ShouldContain(i => i.Message.Contains("ends before it starts"));
        d.Issues.ShouldContain(i => i.Message.Contains("gap"));
    }

    [Test]
    public void MixedDateFormatsAreFlagged()
    {
        var cv = Cv(
            Role("New", "Jan 2024", "Present", "Cut costs by 20% across 3 teams in a year"),
            Role("Old", "2022", "Dec 2023", "Cut costs by 20% across 3 teams in a year"));

        Check(CvScorer.Score(cv), "dates").Issues.ShouldContain(i => i.Message.Contains("different formats"));
    }

    [Test]
    public void SameCvAlwaysGetsTheSameScore()
    {
        var cv = Cv(Role("Lead", "Jan 2024", "Present", "Built a thing", "Built a second thing"));

        CvScorer.Score(cv).Overall.ShouldBe(CvScorer.Score(cv).Overall);
    }

    [Test]
    public void EmptyCvDoesNotThrowAndScoresLow()
    {
        var score = CvScorer.Score(new GeneratedCvDto());

        score.Overall.ShouldBeLessThan(60);
    }

    private const string Fact = "to cut costs by 20% across 3 teams in a year";

    [Test]
    public void WeightsAddUpToOneHundred() => CvScorer.TotalWeight.ShouldBe(100);

    [Test]
    public void NewWeakOpenersAreFlaggedWithReplacements()
    {
        var cv = Cv(Role("Lead", "Jan 2024", "Present",
            $"Used Docker {Fact}", $"Handled releases {Fact}", $"Worked on the billing platform {Fact}"));

        var w = Check(CvScorer.Score(cv), "weak-roles");

        w.Issues.Count(i => i.Message.Contains("Starts with")).ShouldBe(3);
        w.Issues.ShouldContain(i => i.Message.Contains("\"used\"") && i.Message.Contains("applied"));
    }

    [Test]
    public void LedAndManagedAreNotWeakOpeners()
    {
        var cv = Cv(Role("Lead", "Jan 2024", "Present",
            $"Led a team of 6 {Fact}", $"Managed 4 vendors {Fact}", $"Supported 12 services {Fact}"));

        Check(CvScorer.Score(cv), "weak-roles").Issues.ShouldBeEmpty();
    }

    [Test]
    public void PassiveOpenersAreFlagged()
    {
        var cv = Cv(Role("Lead", "Jan 2024", "Present",
            $"Was developed by my team {Fact}", $"Reports were completed {Fact}", $"Cut costs by 20% across 3 teams in a year"));

        Check(CvScorer.Score(cv), "weak-roles").Issues.Count(i => i.Message.StartsWith("Passive")).ShouldBe(1);
    }

    [Test]
    public void NearSynonymVerbsCountAsOneFamily()
    {
        var cv = Cv(Role("Lead", "Jan 2024", "Present",
            $"Built a service {Fact}", $"Developed a tool {Fact}", $"Created a module {Fact}", $"Engineered a pipeline {Fact}"));

        var r = Check(CvScorer.Score(cv), "repetition");

        r.Issues.Count.ShouldBe(1);
        r.Issues.Single().Message.ShouldContain("near-synonyms");
    }

    [Test]
    public void ExactVerbRepeatsAreNotAlsoCountedAsAFamily()
    {
        var cv = Cv(Role("Lead", "Jan 2024", "Present",
            $"Built a service {Fact}", $"Built a tool {Fact}", $"Built a module {Fact}", $"Created a pipeline {Fact}"));

        var r = Check(CvScorer.Score(cv), "repetition");

        r.Issues.Count.ShouldBe(1);
        r.Issues.Single().Message.ShouldContain("\"built\"");
        r.Issues.Single().Message.ShouldContain("Try");
    }

    [Test]
    public void ShortSynonymRunsAreFine()
    {
        var cv = Cv(Role("Lead", "Jan 2024", "Present",
            $"Built a service {Fact}", $"Developed a tool {Fact}", $"Created a module {Fact}", $"Analyzed the data {Fact}"));

        Check(CvScorer.Score(cv), "repetition").Issues.ShouldBeEmpty();
    }

    [Test]
    public void PastTenseUnderACurrentRoleIsNeverFlagged()
    {
        var cv = Cv(Role("Lead", "Jan 2025", "Present",
            $"Spearheaded the platform {Fact}", $"Directed a team {Fact}", $"Automated releases {Fact}"));

        Check(CvScorer.Score(cv), "tense").Issues.ShouldBeEmpty();
    }

    [Test]
    public void PresentTenseUnderAnEndedRoleIsFlaggedWhenRepeated()
    {
        var cv = Cv(Role("Dev", "Jan 2018", "Mar 2020",
            $"Build services {Fact}", $"Develop tools {Fact}", $"Cut costs by 20% across 3 teams in a year"));

        Check(CvScorer.Score(cv), "tense").Issues.Single().Locations.Count.ShouldBe(2);
    }

    [Test]
    public void OnePresentTenseOpenerIsNotEnough()
    {
        var cv = Cv(Role("Dev", "Jan 2018", "Mar 2020",
            $"Test automation framework {Fact}", $"Cut costs by 20% across 3 teams in a year", $"Built services {Fact}"));

        Check(CvScorer.Score(cv), "tense").Issues.ShouldBeEmpty();
    }

    [Test]
    public void UnknownFirstWordsAreNeverPenalised()
    {
        var cv = Cv(Role("Dev", "Jan 2018", "Mar 2020",
            $"Python-based tooling {Fact}", $"Kubernetes migration {Fact}", $"Zxqv pipeline {Fact}"));

        var score = CvScorer.Score(cv);

        Check(score, "tense").Issues.ShouldBeEmpty();
        Check(score, "repetition").Issues.ShouldBeEmpty();
        Check(score, "weak-roles").Issues.Count.ShouldBe(0);
    }

    [Test]
    public void AmbiguousPastWordsAreNotTreatedAsPresentTense()
    {
        var cv = Cv(Role("Dev", "Jan 2018", "Mar 2020",
            $"Found a bug {Fact}", $"Founded a guild {Fact}", $"Hit targets {Fact}"));

        Check(CvScorer.Score(cv), "tense").Issues.ShouldBeEmpty();
    }
}
