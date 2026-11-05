using System.Globalization;
using backend.jobhunter.Application.Common.Interfaces;
using backend.jobhunter.Domain.Entities;

namespace backend.jobhunter.Application.CvDrafts;

// The AI picks and words what goes on the CV, but role, employer, school and dates are facts, so they
// are copied from the profile rows the AI points at (by SourceId) and never trusted from the model.
public static class CvProfileMerger
{
    private static readonly CultureInfo Culture = CultureInfo.InvariantCulture;

    public static GeneratedCvDto Merge(GeneratedCvDto cv, CandidateProfile? profile, List<string> warnings)
        => cv with
        {
            Experience = MergeExperience(cv.Experience, profile, warnings),
            Education = MergeEducation(cv.Education, profile, warnings),
            Skills = CapSkills(DedupeSkills(cv.Skills), CvLimits.MaxSkillItems),
            Headline = HeadlineTitle(cv.Headline),
            Links = MergeLinks(cv.Links, profile),
        };

    // Links are facts too: the model only sees them as text and can mangle them, which breaks the header
    // link and its QR code. Each link it keeps is replaced by the profile's own URL, one that matches no
    // profile link is dropped, and the profile's LinkedIn link is always there if the candidate has one.
    public static List<string> MergeLinks(List<string> links, CandidateProfile? profile)
    {
        var urls = profile?.Links.OrderBy(l => l.SortOrder).Select(l => l.Url.Trim()).Where(u => u.Length > 0).ToList();
        if (urls is null or { Count: 0 }) return links;

        var result = new List<string>();
        foreach (var link in links)
        {
            var match = urls.FirstOrDefault(u => LinkKey(u) == LinkKey(link))
                ?? (IsLinkedIn(link) ? urls.FirstOrDefault(IsLinkedIn) : null);
            if (match is not null && !result.Contains(match)) result.Add(match);
        }

        var linkedIn = urls.FirstOrDefault(IsLinkedIn);
        if (linkedIn is not null && !result.Any(IsLinkedIn)) result.Insert(0, linkedIn);
        return result;
    }

    private static bool IsLinkedIn(string link) => link.Contains("linkedin.com", StringComparison.OrdinalIgnoreCase);

    private static string LinkKey(string link)
    {
        var key = link.Trim().ToLowerInvariant();
        foreach (var prefix in new[] { "https://", "http://", "www." })
        {
            if (key.StartsWith(prefix)) key = key[prefix.Length..];
        }
        return key.TrimEnd('/');
    }

    // The headline is the job title and nothing else. The model sometimes adds skills after it ("Senior
    // Engineer | React | CI/CD"), so everything from the first pipe on is cut. Hand edits are never passed
    // through here, so a user can still write what they like.
    public static string HeadlineTitle(string headline)
    {
        var cut = headline.IndexOf('|');
        if (cut < 0) return headline;
        var title = headline[..cut].Trim();
        return title.Length > 0 ? title : headline.Replace("|", " ").Trim();
    }

    // The prompt asks for at most 20 items but the model does not always keep to it. Extra items are cut from
    // the end, so the order the model chose (most relevant first) is kept. A "Currently learning" group is kept
    // whole: the candidate put those skills there on purpose and it is the only place that tells the reader
    // they are not used at work yet.
    public static List<CvSkillGroupDto> CapSkills(List<CvSkillGroupDto> groups, int max)
    {
        var protectedItems = groups.Where(IsLearning).Sum(g => g.Items.Count);
        var room = Math.Max(0, max - protectedItems);
        var result = new List<CvSkillGroupDto>();
        foreach (var group in groups)
        {
            if (IsLearning(group))
            {
                result.Add(group);
                continue;
            }
            var items = group.Items.Take(room).ToList();
            room -= items.Count;
            if (items.Count > 0) result.Add(group with { Items = items });
        }
        return result;
    }

    private static bool IsLearning(CvSkillGroupDto group)
        => group.Category.Trim().Equals("Currently learning", StringComparison.OrdinalIgnoreCase);

    // The same skill listed in two groups (or twice in one) shows up as padding. Keep the first one,
    // ignoring case and bold markers, and drop any group left empty. Different items such as "React" and
    // "React/ShadCn" stay as they are.
    public static List<CvSkillGroupDto> DedupeSkills(List<CvSkillGroupDto> groups)
    {
        var seen = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        var result = new List<CvSkillGroupDto>();
        foreach (var group in groups)
        {
            var items = group.Items
                .Where(item => !string.IsNullOrWhiteSpace(item) && seen.Add(item.Replace("**", string.Empty).Trim()))
                .ToList();
            if (items.Count > 0) result.Add(group with { Items = items });
        }
        return result;
    }

    public static List<CvExperienceDto> MergeExperience(
        List<CvExperienceDto> entries, CandidateProfile? profile, List<string> warnings)
    {
        var rows = profile?.Experiences.ToDictionary(e => e.Id) ?? [];
        var matched = new List<(CvExperienceDto Entry, DateOnly Start)>();
        var unmatched = new List<CvExperienceDto>();

        foreach (var entry in entries)
        {
            if (entry.SourceId is { } id && rows.TryGetValue(id, out var row))
            {
                var current = row.IsCurrent || row.EndDate is null;
                matched.Add((entry with
                {
                    Role = CvEnglishOnly.Clean(row.Title)!,
                    Company = CvEnglishOnly.Clean(row.Company)!,
                    Location = string.IsNullOrWhiteSpace(CvEnglishOnly.Clean(row.Location)) ? null : CvEnglishOnly.Clean(row.Location),
                    StartDate = row.StartDate.ToString("MMM yyyy", Culture),
                    EndDate = current ? "Present" : row.EndDate!.Value.ToString("MMM yyyy", Culture),
                }, row.StartDate));
            }
            else
            {
                unmatched.Add(entry with
                {
                    StartDate = CvDateText.Normalize(entry.StartDate),
                    EndDate = CvDateText.Normalize(entry.EndDate),
                });
                warnings.Add($"The experience \"{entry.Role} at {entry.Company}\" is not linked to your profile, so its details were not verified.");
            }
        }

        // Reverse-chronological by the profile's own dates; entries without a profile row cannot be
        // dated, so they stay at the end in the order the AI gave them.
        return matched.OrderByDescending(m => m.Start).Select(m => m.Entry).Concat(unmatched).ToList();
    }

    public static List<CvEducationDto> MergeEducation(
        List<CvEducationDto> entries, CandidateProfile? profile, List<string> warnings)
    {
        var rows = profile?.Educations.ToDictionary(e => e.Id) ?? [];
        var matched = new List<(CvEducationDto Entry, DateOnly End)>();
        var unmatched = new List<CvEducationDto>();

        foreach (var entry in entries)
        {
            if (entry.SourceId is { } id && rows.TryGetValue(id, out var row))
            {
                matched.Add((entry with
                {
                    Degree = CvEnglishOnly.Clean(string.IsNullOrWhiteSpace(row.FieldOfStudy) ? row.Degree : $"{row.Degree}, {row.FieldOfStudy}")!,
                    Institution = CvEnglishOnly.Clean(row.Institution)!,
                    StartDate = row.StartDate?.ToString("yyyy", Culture),
                    EndDate = row.EndDate?.ToString("yyyy", Culture),
                }, row.EndDate ?? DateOnly.MaxValue));
            }
            else
            {
                unmatched.Add(entry);
                warnings.Add($"The education \"{entry.Degree} at {entry.Institution}\" is not linked to your profile, so its details were not verified.");
            }
        }

        return matched.OrderByDescending(m => m.End).Select(m => m.Entry).Concat(unmatched).ToList();
    }
}
