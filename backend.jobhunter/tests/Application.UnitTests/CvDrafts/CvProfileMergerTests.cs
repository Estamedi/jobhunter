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
}
