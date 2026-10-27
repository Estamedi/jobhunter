using backend.jobhunter.Application.CvDrafts;
using NUnit.Framework;
using Shouldly;

namespace backend.jobhunter.Application.UnitTests.CvDrafts;

public class CvJobPostingTests
{
    [Test]
    public void ShouldJoinDescriptionAndRequirements()
        => CvJobPosting.Compose("Build APIs.", "- C#\n- SQL").ShouldBe("Build APIs.\n\nRequirements:\n- C#\n- SQL");

    [Test]
    public void ShouldWorkWithOnlyOnePartAndTrim()
    {
        CvJobPosting.Compose("  Build APIs.  ", null).ShouldBe("Build APIs.");
        CvJobPosting.Compose(null, " - C# ").ShouldBe("Requirements:\n- C#");
    }

    [Test]
    public void ShouldReturnNullWhenThereIsNothing()
    {
        CvJobPosting.Compose(null, null).ShouldBeNull();
        CvJobPosting.Compose("  ", "").ShouldBeNull();
    }
}
