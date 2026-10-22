using backend.jobhunter.Application.CvDrafts;
using backend.jobhunter.Domain.Entities;
using backend.jobhunter.Domain.Enums;
using NUnit.Framework;
using Shouldly;

namespace backend.jobhunter.Application.UnitTests.CvDrafts;

public class CvBackgroundBuilderTests
{
    [Test]
    public void ShouldReturnNullWithoutProfileOrNotes()
    {
        CvBackgroundBuilder.Build(null, null).ShouldBeNull();
        CvBackgroundBuilder.Build(new CandidateProfile(), "  ").ShouldBeNull();
    }

    [Test]
    public void ShouldReturnOnlyNotesWithoutProfile()
    {
        var text = CvBackgroundBuilder.Build(null, "Prefer cloud roles");

        text.ShouldNotBeNull();
        text.ShouldContain("Additional notes from the candidate:");
        text.ShouldContain("Prefer cloud roles");
    }

    [Test]
    public void ShouldListExperienceNewestFirstWithDatesAndSkills()
    {
        var profile = new CandidateProfile
        {
            Headline = "Software engineer",
            Summary = "13+ years.",
            Experiences =
            {
                new ProfileExperience
                {
                    Title = "Dev", Company = "Globex",
                    StartDate = new DateOnly(2020, 2, 1), EndDate = new DateOnly(2022, 4, 1),
                },
                new ProfileExperience
                {
                    Title = "Technical Lead", Company = "Acme", IsCurrent = true,
                    StartDate = new DateOnly(2026, 1, 1), Location = "Muscat",
                    WorkplaceType = WorkplaceType.OnSite, EmploymentType = EmploymentType.FullTime,
                    Description = "• Led a team\n• Cut costs", Skills = ["Azure DevOps", "Ansible"],
                },
            },
        };

        var text = CvBackgroundBuilder.Build(profile, null)!;

        text.ShouldContain("Headline: Software engineer");
        text.ShouldContain("- Technical Lead at Acme (FullTime), Muscat, OnSite | Jan 2026 - Present");
        text.ShouldContain("  • Led a team");
        text.ShouldContain("  Skills: Azure DevOps, Ansible");
        text.ShouldContain("- Dev at Globex | Feb 2020 - Apr 2022");
        text.IndexOf("Acme", StringComparison.Ordinal).ShouldBeLessThan(text.IndexOf("Globex", StringComparison.Ordinal));
    }

    [Test]
    public void ShouldIncludeEverySection()
    {
        var profile = new CandidateProfile
        {
            Educations = { new ProfileEducation { Institution = "Sample University", Degree = "BSc", FieldOfStudy = "Software Engineering", StartDate = new DateOnly(2010, 1, 1), EndDate = new DateOnly(2012, 1, 1) } },
            Skills =
            {
                new ProfileSkill { Name = "C#", Category = "Backend" },
                new ProfileSkill { Name = "Docker", Category = "DevOps", SortOrder = 1 },
                new ProfileSkill { Name = "SQL", Category = "Backend", SortOrder = 2 },
            },
            Projects = { new ProfileProject { Name = "Detector", Description = "AI", Url = "https://example.com" } },
            Certifications = { new ProfileCertification { Name = "AZ-204", Issuer = "Microsoft", IssuedDate = new DateOnly(2024, 1, 1) } },
            Languages = { new ProfileLanguage { Name = "English", Proficiency = LanguageProficiency.FullProfessional } },
            Links = { new ProfileLink { Label = "GitHub", Url = "https://github.com/example" } },
        };

        var text = CvBackgroundBuilder.Build(profile, null)!;

        text.ShouldContain("- BSc, Software Engineering at Sample University | 2010 - 2012");
        text.ShouldContain("- Backend: C#, SQL");
        text.ShouldContain("- DevOps: Docker");
        text.ShouldContain("- Detector: AI (https://example.com)");
        text.ShouldContain("- AZ-204, Microsoft (2024)");
        text.ShouldContain("- English (FullProfessional)");
        text.ShouldContain("- GitHub: https://github.com/example");
    }
}
