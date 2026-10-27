using backend.jobhunter.Application.Common.Interfaces;
using backend.jobhunter.Application.CvDrafts;
using NUnit.Framework;
using Shouldly;

namespace backend.jobhunter.Application.UnitTests.CvDrafts;

public class CvJobMatcherTests
{
    private static JobRequirementDto Req(string name, params string[] aliases)
        => new() { Name = name, Aliases = [.. aliases] };

    private static GeneratedCvDto Cv() => new()
    {
        Headline = "Senior DevOps Engineer",
        Summary = "Runs **Kubernetes** platforms on Azure.",
        Skills = [new CvSkillGroupDto { Category = "Tools", Items = ["Terraform", "Ansible"] }],
        Experience = [new CvExperienceDto { Role = "Lead", Company = "Acme", Bullets = ["Built CI/CD pipelines in C# and .NET."] }],
    };

    private static RequirementStatus StatusOf(CvJobMatchDto result, string name)
        => result.Requirements.Single(r => r.Name == name).Status;

    [Test]
    public void ShouldSeparateContextSkillsOnlyProfileOnlyAndMissing()
    {
        var requirements = new JobRequirementsDto
        {
            MustHave = [Req("Kubernetes"), Req("Terraform"), Req("Python"), Req("Rust")],
        };

        var result = CvJobMatcher.Match(requirements, Cv(), "Skills: Python, Bash");

        StatusOf(result, "Kubernetes").ShouldBe(RequirementStatus.InCv);
        StatusOf(result, "Terraform").ShouldBe(RequirementStatus.SkillsOnly);
        StatusOf(result, "Python").ShouldBe(RequirementStatus.InProfile);
        StatusOf(result, "Rust").ShouldBe(RequirementStatus.Missing);
    }

    [Test]
    public void ShouldCountMustHavesCoveredByTheCvOnly()
    {
        var requirements = new JobRequirementsDto
        {
            MustHave = [Req("Kubernetes"), Req("Terraform"), Req("Python"), Req("Rust")],
            NiceToHave = [Req("Ansible"), Req("Go")],
        };

        var result = CvJobMatcher.Match(requirements, Cv(), "Python");

        result.MustHaveTotal.ShouldBe(4);
        result.MustHaveCovered.ShouldBe(2); // Kubernetes in context, Terraform in skills
        result.Requirements.Count.ShouldBe(6);
        result.Requirements.Where(r => !r.MustHave).Select(r => r.Name).ShouldBe(["Ansible", "Go"]);
    }

    [Test]
    public void ShouldMatchAnAliasAndIgnoreBoldMarkers()
    {
        var cv = Cv() with { Summary = "Runs **K8s** platforms." };

        var result = CvJobMatcher.Match(new JobRequirementsDto { MustHave = [Req("Kubernetes", "K8s")] }, cv, null);

        StatusOf(result, "Kubernetes").ShouldBe(RequirementStatus.InCv);
    }

    [Test]
    public void ShouldMatchTermsWithSymbols()
    {
        var result = CvJobMatcher.Match(
            new JobRequirementsDto { MustHave = [Req("C#"), Req(".NET"), Req("CI/CD")] }, Cv(), null);

        result.Requirements.ShouldAllBe(r => r.Status == RequirementStatus.InCv);
    }

    [Test]
    public void ShouldNotMatchATermInsideAnotherWord()
    {
        var cv = Cv() with { Summary = "Worked at Google on Django and Goroutines." };

        var result = CvJobMatcher.Match(
            new JobRequirementsDto { MustHave = [Req("Go"), Req("Java")] }, cv, "Javascript");

        StatusOf(result, "Go").ShouldBe(RequirementStatus.Missing);
        StatusOf(result, "Java").ShouldBe(RequirementStatus.Missing);
    }

    [Test]
    public void ShouldIgnoreBlankAndRepeatedNamesAndPassOtherRequirementsThrough()
    {
        var requirements = new JobRequirementsDto
        {
            MustHave = [Req("Kubernetes"), Req("  "), Req("kubernetes")],
            NiceToHave = [Req("Kubernetes")],
            OtherRequirements = ["5+ years of experience"],
        };

        var result = CvJobMatcher.Match(requirements, Cv(), null);

        result.Requirements.ShouldHaveSingleItem();
        result.OtherRequirements.ShouldBe(["5+ years of experience"]);
    }

    [Test]
    public void ShouldFindAWholeTermAtTheStartAndEndOfTheText()
    {
        CvJobMatcher.ContainsTerm("Go", "Go").ShouldBeTrue();
        CvJobMatcher.ContainsTerm("Go, Rust", "go").ShouldBeTrue();
        CvJobMatcher.ContainsTerm("I use Go", "Go").ShouldBeTrue();
        CvJobMatcher.ContainsTerm("Google", "Go").ShouldBeFalse();
        CvJobMatcher.ContainsTerm("Mongo", "Go").ShouldBeFalse();
    }
}
