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
}
