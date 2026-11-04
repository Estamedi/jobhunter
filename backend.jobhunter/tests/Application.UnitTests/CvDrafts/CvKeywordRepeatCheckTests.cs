using backend.jobhunter.Application.Common.Interfaces;
using backend.jobhunter.Application.CvDrafts;
using NUnit.Framework;
using Shouldly;

namespace backend.jobhunter.Application.UnitTests.CvDrafts;

public class CvKeywordRepeatCheckTests
{
    private static JobRequirementsDto Needs(params string[] names) => new()
    {
        MustHave = names.Select(n => new JobRequirementDto { Name = n }).ToList(),
    };

    private static GeneratedCvDto CvWith(int times, string word = "Terraform") => new()
    {
        Summary = $"Engineer who works with {word}.",
        Experience = [new CvExperienceDto { Role = "Lead", Company = "Acme", Bullets = Enumerable.Repeat($"Wrote {word} modules.", times - 1).ToList() }],
    };

    [Test]
    public void ShouldReportAKeywordUsedMoreOftenThanTheCap()
    {
        var found = CvKeywordRepeatCheck.Find(CvWith(8), Needs("Terraform"));

        var repeat = found.ShouldHaveSingleItem();
        repeat.Keyword.ShouldBe("Terraform");
        repeat.Count.ShouldBe(8);
    }

    [Test]
    public void ShouldAcceptAKeywordUsedExactlyAsOftenAsTheCap()
    {
        CvKeywordRepeatCheck.Find(CvWith(6), Needs("Terraform")).ShouldBeEmpty();
    }

    [Test]
    public void ShouldNotCountTheSkillsList()
    {
        var cv = CvWith(6) with { Skills = [new CvSkillGroupDto { Category = "Cloud", Items = ["Terraform"] }] };

        CvKeywordRepeatCheck.Find(cv, Needs("Terraform")).ShouldBeEmpty();
    }

    [Test]
    public void ShouldCountBoldedUsesAndIgnoreCase()
    {
        var found = CvKeywordRepeatCheck.Find(CvWith(7, "**terraform**"), Needs("Terraform"));

        found.ShouldHaveSingleItem().Count.ShouldBe(7);
    }

    [Test]
    public void ShouldNotAddUpAliasesOfTheSameKeyword()
    {
        var requirements = new JobRequirementsDto
        {
            MustHave = [new JobRequirementDto { Name = "Kubernetes", Aliases = ["K8s"] }],
        };
        var cv = new GeneratedCvDto
        {
            Summary = "Kubernetes Kubernetes Kubernetes Kubernetes Kubernetes. K8s K8s K8s K8s.",
        };

        CvKeywordRepeatCheck.Find(cv, requirements).ShouldBeEmpty();
    }

    [Test]
    public void ShouldNotMatchAKeywordInsideAnotherWord()
    {
        var cv = new GeneratedCvDto { Summary = string.Join(' ', Enumerable.Repeat("Google", 10)) };

        CvKeywordRepeatCheck.Find(cv, Needs("Go")).ShouldBeEmpty();
    }

    [Test]
    public void ShouldFindNothingWithoutRequirements()
    {
        CvKeywordRepeatCheck.Find(CvWith(20), null).ShouldBeEmpty();
    }

    [Test]
    public void ShouldNotCountRoleNamesTheHeadlineOrProjectNamesBecauseTheWriterCannotChangeThem()
    {
        var cv = new GeneratedCvDto
        {
            Headline = ".NET Developer",
            Summary = "Builds services.",
            Experience = Enumerable.Range(0, 7)
                .Select(i => new CvExperienceDto { Role = ".NET Developer", Company = $"Company {i}", Bullets = i == 0 ? ["Built APIs with .NET."] : [] })
                .ToList(),
            Projects = Enumerable.Range(0, 5).Select(i => new CvProjectDto { Name = $".NET project {i}" }).ToList(),
        };

        CvKeywordRepeatCheck.Find(cv, Needs(".NET")).ShouldBeEmpty();
    }
}
