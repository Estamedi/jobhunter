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
        };

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
                    Role = row.Title,
                    Company = row.Company,
                    Location = string.IsNullOrWhiteSpace(row.Location) ? null : row.Location,
                    StartDate = row.StartDate.ToString("MMM yyyy", Culture),
                    EndDate = current ? "Present" : row.EndDate!.Value.ToString("MMM yyyy", Culture),
                }, row.StartDate));
            }
            else
            {
                unmatched.Add(entry);
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
                    Degree = string.IsNullOrWhiteSpace(row.FieldOfStudy) ? row.Degree : $"{row.Degree}, {row.FieldOfStudy}",
                    Institution = row.Institution,
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
