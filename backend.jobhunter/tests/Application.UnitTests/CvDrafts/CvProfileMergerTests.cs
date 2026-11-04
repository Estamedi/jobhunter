using backend.jobhunter.Application.Common.Interfaces;
using backend.jobhunter.Application.CvDrafts;
using backend.jobhunter.Domain.Entities;
using NUnit.Framework;
using Shouldly;

namespace backend.jobhunter.Application.UnitTests.CvDrafts;

public class CvProfileMergerTests
{
    private static CandidateProfile Profile() => new()
    {
        Experiences =
        {
            new ProfileExperience { Id = 1, Title = "Dev", Company = "Globex", StartDate = new DateOnly(2018, 3, 1), EndDate = new DateOnly(2020, 5, 1), Location = "Dubai" },
            new ProfileExperience { Id = 2, Title = "Technical Lead", Company = "Acme", StartDate = new DateOnly(2022, 1, 1), IsCurrent = true },
        },
        Educations =
        {
            new ProfileEducation { Id = 9, Degree = "BSc", FieldOfStudy = "Computer Science", Institution = "Uni", StartDate = new DateOnly(2010, 9, 1), EndDate = new DateOnly(2014, 6, 1) },
        },
    };

    [Test]
    public void ShouldOverwriteFactsFromTheProfileRow()
    {
        var cv = new GeneratedCvDto
        {
            Experience = [new CvExperienceDto { SourceId = 2, Role = "CTO", Company = "Acme Corp", StartDate = "2019", EndDate = "2021", Bullets = ["Led a team"] }],
        };

        var merged = CvProfileMerger.Merge(cv, Profile(), []);

        var job = merged.Experience.ShouldHaveSingleItem();
        job.Role.ShouldBe("Technical Lead");
        job.Company.ShouldBe("Acme");
        job.StartDate.ShouldBe("Jan 2022");
        job.EndDate.ShouldBe("Present");
        job.Bullets.ShouldBe(["Led a team"]);
    }

    [Test]
    public void ShouldSortRolesNewestFirstWhateverOrderTheAiUsed()
    {
        var cv = new GeneratedCvDto
        {
            Experience =
            [
                new CvExperienceDto { SourceId = 1, Role = "Dev", Company = "Globex" },
                new CvExperienceDto { SourceId = 2, Role = "Lead", Company = "Acme" },
            ],
        };

        var merged = CvProfileMerger.Merge(cv, Profile(), []);

        merged.Experience.Select(e => e.Company).ShouldBe(["Acme", "Globex"]);
        merged.Experience[1].EndDate.ShouldBe("May 2020");
        merged.Experience[1].Location.ShouldBe("Dubai");
    }

    [Test]
    public void ShouldKeepEntriesWithoutAProfileRowAtTheEndAndWarn()
    {
        var warnings = new List<string>();
        var cv = new GeneratedCvDto
        {
            Experience =
            [
                new CvExperienceDto { SourceId = null, Role = "Freelancer", Company = "Self" },
                new CvExperienceDto { SourceId = 999, Role = "Ghost", Company = "Nowhere" },
                new CvExperienceDto { SourceId = 1, Role = "Dev", Company = "Globex" },
            ],
        };

        var merged = CvProfileMerger.Merge(cv, Profile(), warnings);

        merged.Experience.Select(e => e.Company).ShouldBe(["Globex", "Self", "Nowhere"]);
        warnings.Count.ShouldBe(2);
    }

    [Test]
    public void ShouldOverwriteEducationFromTheProfileRow()
    {
        var cv = new GeneratedCvDto
        {
            Education = [new CvEducationDto { SourceId = 9, Degree = "MSc", Institution = "Harvard", StartDate = "2000", EndDate = "2004", Details = "Honours" }],
        };

        var merged = CvProfileMerger.Merge(cv, Profile(), []);

        var edu = merged.Education.ShouldHaveSingleItem();
        edu.Degree.ShouldBe("BSc, Computer Science");
        edu.Institution.ShouldBe("Uni");
        edu.StartDate.ShouldBe("2010");
        edu.EndDate.ShouldBe("2014");
        edu.Details.ShouldBe("Honours");
    }

    [Test]
    public void ShouldFlagEverythingWhenThereIsNoProfile()
    {
        var warnings = new List<string>();
        var cv = new GeneratedCvDto { Experience = [new CvExperienceDto { SourceId = 1, Role = "Dev", Company = "Globex" }] };

        var merged = CvProfileMerger.Merge(cv, null, warnings);

        merged.Experience.ShouldHaveSingleItem().Company.ShouldBe("Globex");
        warnings.ShouldHaveSingleItem();
    }

    [Test]
    public void ShouldDropSkillsListedMoreThanOnceAndEmptyGroups()
    {
        var cv = new GeneratedCvDto
        {
            Skills =
            [
                new CvSkillGroupDto { Category = "Languages", Items = ["C#", "SQL", "React"] },
                new CvSkillGroupDto { Category = "Data", Items = ["sql", "**SQL**", "PostgreSQL"] },
                new CvSkillGroupDto { Category = "Dupes only", Items = ["C#", "React"] },
                new CvSkillGroupDto { Category = "Web", Items = ["React/ShadCn"] },
            ],
        };

        var merged = CvProfileMerger.Merge(cv, Profile(), []);

        merged.Skills.Select(g => g.Category).ShouldBe(["Languages", "Data", "Web"]);
        merged.Skills[1].Items.ShouldBe(["PostgreSQL"]);
        merged.Skills[2].Items.ShouldBe(["React/ShadCn"]);
    }

    [TestCase("Current", "Present")]
    [TestCase("now", "Present")]
    [TestCase("Ongoing", "Present")]
    [TestCase("To date", "Present")]
    [TestCase("January 2022", "Jan 2022")]
    [TestCase("Sept 2021", "Sep 2021")]
    [TestCase("mar. 2020", "Mar 2020")]
    [TestCase("9/2013", "Sep 2013")]
    [TestCase("2019-03", "Mar 2019")]
    [TestCase("Spring 2020", "Spring 2020")]
    [TestCase("2018", "2018")]
    [TestCase("13/2020", "13/2020")]
    public void ShouldPutAnUnlinkedEntrysDatesInTheCvFormat(string written, string expected)
    {
        var cv = new GeneratedCvDto
        {
            Experience = [new CvExperienceDto { Role = "Dev", Company = "Own notes", StartDate = written, EndDate = written }],
        };

        var merged = CvProfileMerger.Merge(cv, Profile(), []);

        merged.Experience[0].StartDate.ShouldBe(expected);
        merged.Experience[0].EndDate.ShouldBe(expected);
    }

    [TestCase("Senior Software Engineer | React | CI/CD", "Senior Software Engineer")]
    [TestCase("Senior Software Engineer|React", "Senior Software Engineer")]
    [TestCase("Senior Software Engineer", "Senior Software Engineer")]
    [TestCase("| React | CI/CD", "React   CI/CD")]
    public void ShouldKeepOnlyTheJobTitleInTheHeadline(string headline, string expected)
    {
        var merged = CvProfileMerger.Merge(new GeneratedCvDto { Headline = headline }, null, []);

        merged.Headline.ShouldBe(expected);
    }

    private static List<CvSkillGroupDto> Groups(params (string Category, int Items)[] groups)
        => groups.Select(g => new CvSkillGroupDto
        {
            Category = g.Category,
            Items = Enumerable.Range(1, g.Items).Select(i => $"{g.Category} {i}").ToList(),
        }).ToList();

    [Test]
    public void ShouldCutSkillsOverTheCapFromTheEndAndKeepTheModelsOrder()
    {
        var cut = CvProfileMerger.CapSkills(Groups(("Backend", 12), ("Cloud", 10), ("Tools", 6)), 20);

        cut.Select(g => g.Items.Count).ShouldBe([12, 8]);
        cut[1].Items[0].ShouldBe("Cloud 1");
        cut.Sum(g => g.Items.Count).ShouldBe(20);
    }

    [Test]
    public void ShouldLeaveSkillsAloneWhenUnderTheCap()
    {
        var groups = Groups(("Backend", 5), ("Cloud", 4));

        CvProfileMerger.CapSkills(groups, 20).Select(g => g.Items.Count).ShouldBe([5, 4]);
    }

    [Test]
    public void ShouldKeepTheCurrentlyLearningGroupWholeAndCutOthersToMakeRoom()
    {
        var cut = CvProfileMerger.CapSkills(Groups(("Backend", 15), ("Currently learning", 3), ("Cloud", 10)), 20);

        cut.Select(g => g.Category).ShouldBe(["Backend", "Currently learning", "Cloud"]);
        cut.Select(g => g.Items.Count).ShouldBe([15, 3, 2]);
    }

    [Test]
    public void ShouldNeverCutTheCurrentlyLearningGroupEvenWhenItIsAloneOverTheCap()
    {
        var cut = CvProfileMerger.CapSkills(Groups(("Backend", 4), ("Currently learning", 22)), 20);

        cut.ShouldHaveSingleItem().Items.Count.ShouldBe(22);
    }

    [Test]
    public void ShouldApplyBothCleanUpsWhenMergingAGeneratedCv()
    {
        var cv = new GeneratedCvDto { Headline = "Engineer | Go", Skills = Groups(("Backend", 30)) };

        var merged = CvProfileMerger.Merge(cv, null, []);

        merged.Headline.ShouldBe("Engineer");
        merged.Skills.Sum(g => g.Items.Count).ShouldBe(20);
    }

    [Test]
    public void ShouldCutAnOrdinarySkillGroupThatHasLearningInItsName()
    {
        var cut = CvProfileMerger.CapSkills(Groups(("Machine Learning", 10), ("Backend", 15)), 20);

        cut.Sum(g => g.Items.Count).ShouldBe(20);
        cut.Select(g => g.Items.Count).ShouldBe([10, 10]);

        var big = CvProfileMerger.CapSkills(Groups(("Machine Learning", 25), ("Backend", 10)), 20);
        big.Sum(g => g.Items.Count).ShouldBe(20);
    }
}
