using backend.jobhunter.Application.CandidateProfiles;
using backend.jobhunter.Application.Common.Interfaces;
using NUnit.Framework;
using Shouldly;

namespace backend.jobhunter.Application.UnitTests.CandidateProfiles;

public class ProfileImportClampTests
{
    [Test]
    public void ClampToLimits_TrimsLongDescriptionsAtALineBreak()
    {
        var bullets = string.Join("\n", Enumerable.Repeat("• " + new string('a', 98), 30)); // ~3,000 chars
        var parsed = new ParsedProfileDto
        {
            Experiences = [new ParsedExperienceDto { Title = "Dev", Company = "X", Description = bullets }],
            Projects = [new ParsedProjectDto { Name = "P", Description = new string('b', 2500) }],
        };

        var clamped = ProfileImportService.ClampToLimits(parsed);

        clamped.Experiences[0].Description!.Length.ShouldBeLessThanOrEqualTo(2000);
        clamped.Experiences[0].Description!.ShouldEndWith(new string('a', 98));
        clamped.Projects[0].Description!.Length.ShouldBe(2000);
    }

    [Test]
    public void ClampToLimits_LeavesShortTextAlone()
    {
        var parsed = new ParsedProfileDto { Summary = "Short", Experiences = [new ParsedExperienceDto { Description = "ok" }] };

        var clamped = ProfileImportService.ClampToLimits(parsed);

        clamped.Summary.ShouldBe("Short");
        clamped.Experiences[0].Description.ShouldBe("ok");
    }
}
