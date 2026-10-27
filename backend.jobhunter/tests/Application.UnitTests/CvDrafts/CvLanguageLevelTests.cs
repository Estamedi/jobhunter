using backend.jobhunter.Application.CvDrafts;
using backend.jobhunter.Application.CvDrafts.Commands.GenerateCvDraft;
using NUnit.Framework;
using Shouldly;

namespace backend.jobhunter.Application.UnitTests.CvDrafts;

public class CvLanguageLevelTests
{
    [Test]
    public void ShouldDefaultToB2WhenMissingOrUnknown()
    {
        CvLanguageLevel.Default.ShouldBe("B2");
        CvLanguageLevel.Normalize(null).ShouldBe("B2");
        CvLanguageLevel.Normalize("  ").ShouldBe("B2");
        CvLanguageLevel.Normalize("Z9").ShouldBe("B2");
    }

    [TestCase("a2", "A2")]
    [TestCase(" c1 ", "C1")]
    [TestCase("B1", "B1")]
    public void ShouldNormalizeKnownLevels(string input, string expected)
        => CvLanguageLevel.Normalize(input).ShouldBe(expected);

    [Test]
    public void ShouldDescribeEveryLevelDifferently()
        => CvLanguageLevel.All.Select(CvLanguageLevel.Describe).Distinct().Count().ShouldBe(CvLanguageLevel.All.Length);

    [TestCase(null, true)]
    [TestCase("", true)]
    [TestCase("B2", true)]
    [TestCase("c2", true)]
    [TestCase("A1", false)]
    [TestCase("fluent", false)]
    public void ShouldAcceptOnlyCefrLevelsA2ToC2(string? level, bool valid)
    {
        var command = new GenerateCvDraftCommand { CandidateId = 1, JobTitle = "Engineer", LanguageLevel = level };

        new GenerateCvDraftCommandValidator().Validate(command).IsValid.ShouldBe(valid);
    }
}
