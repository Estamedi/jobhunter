using backend.jobhunter.Application.CvDrafts;
using backend.jobhunter.Domain.Entities;
using NUnit.Framework;
using Shouldly;

namespace backend.jobhunter.Application.UnitTests.CvDrafts;

public class CvLengthGuideTests
{
    private static readonly DateOnly Today = new(2026, 10, 27);

    private static CandidateProfile StartedOn(DateOnly start)
        => new() { Experiences = { new ProfileExperience { StartDate = start }, new ProfileExperience { StartDate = start.AddYears(5) } } };

    [Test]
    public void ShouldAimForOnePageBeforeTenYears()
        => CvLengthGuide.TargetPages(StartedOn(new DateOnly(2018, 1, 1)), Today).ShouldBe(1);

    [Test]
    public void ShouldAimForTwoPagesFromTenYears()
    {
        CvLengthGuide.TargetPages(StartedOn(new DateOnly(2016, 10, 27)), Today).ShouldBe(2);
        CvLengthGuide.TargetPages(StartedOn(new DateOnly(2010, 5, 1)), Today).ShouldBe(2);
    }

    [Test]
    public void ShouldCountWholeYearsOnly()
        => CvLengthGuide.TargetPages(StartedOn(new DateOnly(2016, 10, 28)), Today).ShouldBe(1);

    [Test]
    public void ShouldGiveNoTargetWithoutDatedExperience()
    {
        CvLengthGuide.TargetPages(null, Today).ShouldBeNull();
        CvLengthGuide.TargetPages(new CandidateProfile(), Today).ShouldBeNull();
    }
}
