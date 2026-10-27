using backend.jobhunter.Domain.Entities;

namespace backend.jobhunter.Application.CvDrafts;

public static class CvLengthGuide
{
    private const int TwoPageYears = 10;

    // One page for earlier careers, two from ten years of experience. Null when the profile has no
    // dated experience to judge from, in which case the AI is given no length target.
    public static int? TargetPages(CandidateProfile? profile, DateOnly today)
    {
        if (profile is null || profile.Experiences.Count == 0) return null;

        var earliest = profile.Experiences.Min(e => e.StartDate);
        var years = today.Year - earliest.Year - (today < earliest.AddYears(today.Year - earliest.Year) ? 1 : 0);
        return years >= TwoPageYears ? 2 : 1;
    }
}
