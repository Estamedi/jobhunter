using backend.jobhunter.Application.Common.Interfaces;
using backend.jobhunter.Application.CvDrafts;
using NUnit.Framework;
using Shouldly;

namespace backend.jobhunter.Application.UnitTests.CvDrafts;

public class CvGroundingValidatorTests
{
    private const string Background = """
        - Technical Lead at Acme | Jan 2022 - Present
          Cut cloud costs by 30% across 12 services.
        - BSc, Computer Science at Muscat University | 2010 - 2014
        - AZ-204, Microsoft (2023)
        """;

    [Test]
    public void ShouldAcceptACvThatOnlyUsesTheBackground()
    {
        var cv = new GeneratedCvDto
        {
            Summary = "Lead who cut costs by **30%**.",
            Experience = [new CvExperienceDto { Role = "Technical Lead", Company = "Acme", Bullets = ["Cut cloud costs by 30% across 12 services."] }],
            Education = [new CvEducationDto { Degree = "BSc", Institution = "Muscat University" }],
            Certifications = ["AZ-204 (Microsoft, 2023)"],
        };

        CvGroundingValidator.Validate(cv, Background).ShouldBeEmpty();
    }

    [Test]
    public void ShouldFlagAnInventedEmployer()
    {
        var cv = new GeneratedCvDto { Experience = [new CvExperienceDto { Role = "CTO", Company = "Initech" }] };

        CvGroundingValidator.Validate(cv, Background).ShouldHaveSingleItem().ShouldContain("Initech");
    }

    [Test]
    public void ShouldFlagAnInventedSchoolAndCertification()
    {
        var cv = new GeneratedCvDto
        {
            Education = [new CvEducationDto { Degree = "MBA", Institution = "Wharton" }],
            Certifications = ["PMP"],
        };

        var warnings = CvGroundingValidator.Validate(cv, Background);

        warnings.Count.ShouldBe(2);
        warnings.ShouldContain(w => w.Contains("Wharton"));
        warnings.ShouldContain(w => w.Contains("PMP"));
    }

    [Test]
    public void ShouldFlagAFigureThatIsNotInTheBackground()
    {
        var cv = new GeneratedCvDto
        {
            Summary = "Grew revenue by **250%**.",
            Experience = [new CvExperienceDto { Company = "Acme", Bullets = ["Saved 30% on 7 projects."] }],
        };

        // 250% is invented; 30% is in the background; a lone digit is ignored.
        CvGroundingValidator.Validate(cv, Background).ShouldHaveSingleItem().ShouldContain("250%");
    }

    [Test]
    public void ShouldFlagEverythingWhenThereIsNoBackground()
    {
        var cv = new GeneratedCvDto { Experience = [new CvExperienceDto { Company = "Acme" }] };

        CvGroundingValidator.Validate(cv, null).ShouldHaveSingleItem();
    }
}
