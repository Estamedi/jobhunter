using backend.jobhunter.Application.Common.Interfaces;
using backend.jobhunter.Domain.Entities;
using backend.jobhunter.Domain.Enums;

namespace backend.jobhunter.Application.CandidateProfiles;

public record ProfileExperienceDto(
    int Id,
    string Title,
    string? EmploymentType,
    string Company,
    bool IsCurrent,
    DateOnly StartDate,
    DateOnly? EndDate,
    string? Location,
    string? WorkplaceType,
    string? Description,
    IReadOnlyList<string> Skills
);

public record ProfileEducationDto(
    int Id,
    string Institution,
    string Degree,
    string? FieldOfStudy,
    string? Location,
    DateOnly? StartDate,
    DateOnly? EndDate,
    string? Details
);

public record ProfileSkillDto(int Id, string Name, string? Category);

public record ProfileProjectDto(
    int Id,
    string Name,
    string? Description,
    string? Url,
    DateOnly? StartDate,
    DateOnly? EndDate
);

public record ProfileCertificationDto(
    int Id,
    string Name,
    string? Issuer,
    DateOnly? IssuedDate,
    DateOnly? ExpiryDate,
    string? CredentialUrl
);

public record ProfileLanguageDto(int Id, string Name, string Proficiency);

public record ProfileLinkDto(int Id, string Label, string Url);

public record CandidateProfileDto(
    int? Id,
    int CandidateId,
    string? Headline,
    string? Summary,
    IReadOnlyList<ProfileExperienceDto> Experiences,
    IReadOnlyList<ProfileEducationDto> Educations,
    IReadOnlyList<ProfileSkillDto> Skills,
    IReadOnlyList<ProfileProjectDto> Projects,
    IReadOnlyList<ProfileCertificationDto> Certifications,
    IReadOnlyList<ProfileLanguageDto> Languages,
    IReadOnlyList<ProfileLinkDto> Links
);

internal static class CandidateProfileMapping
{
    public static ProfileExperienceDto ToDto(this ProfileExperience e) => new(
        e.Id, e.Title, e.EmploymentType?.ToString(), e.Company, e.IsCurrent, e.StartDate, e.EndDate,
        e.Location, e.WorkplaceType?.ToString(), e.Description, e.Skills);

    public static CandidateProfileDto ToDto(this CandidateProfile p) => new(
        p.Id, p.CandidateId, p.Headline, p.Summary,
        p.Experiences.OrderByDescending(e => e.StartDate).Select(e => e.ToDto()).ToList(),
        p.Educations.OrderByDescending(e => e.EndDate ?? DateOnly.MaxValue).ThenByDescending(e => e.StartDate)
            .Select(e => e.ToDto()).ToList(),
        p.Skills.OrderBy(s => s.SortOrder).ThenBy(s => s.Id).Select(s => s.ToDto()).ToList(),
        p.Projects.OrderBy(x => x.SortOrder).ThenBy(x => x.Id)
            .Select(x => new ProfileProjectDto(x.Id, x.Name, x.Description, x.Url, x.StartDate, x.EndDate)).ToList(),
        p.Certifications.OrderBy(x => x.SortOrder).ThenBy(x => x.Id)
            .Select(x => new ProfileCertificationDto(x.Id, x.Name, x.Issuer, x.IssuedDate, x.ExpiryDate, x.CredentialUrl)).ToList(),
        p.Languages.OrderBy(x => x.SortOrder).ThenBy(x => x.Id)
            .Select(x => new ProfileLanguageDto(x.Id, x.Name, x.Proficiency.ToString())).ToList(),
        p.Links.OrderBy(x => x.SortOrder).ThenBy(x => x.Id)
            .Select(x => new ProfileLinkDto(x.Id, x.Label, x.Url)).ToList());

    public static ProfileEducationDto ToDto(this ProfileEducation e) => new(
        e.Id, e.Institution, e.Degree, e.FieldOfStudy, e.Location, e.StartDate, e.EndDate, e.Details);

    public static ProfileSkillDto ToDto(this ProfileSkill s) => new(s.Id, s.Name, s.Category);

    // Skills are trimmed, de-duplicated (case-insensitive) and capped; empty entries dropped.
    public static List<string> CleanSkills(IEnumerable<string>? skills) =>
        (skills ?? [])
            .Select(s => s.Trim())
            .Where(s => s.Length > 0)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

    public static T? ParseEnum<T>(string? value) where T : struct, Enum
        => string.IsNullOrWhiteSpace(value) ? null : Enum.Parse<T>(value, ignoreCase: true);

    // Returns the candidate's profile, creating an empty one on first use.
    public static async Task<CandidateProfile> GetOrCreateAsync(
        this IApplicationDbContext context, int candidateId, CancellationToken cancellationToken)
    {
        var profile = await context.CandidateProfiles
            .FirstOrDefaultAsync(p => p.CandidateId == candidateId, cancellationToken);
        if (profile is not null) return profile;

        if (!await context.Candidates.AnyAsync(c => c.Id == candidateId, cancellationToken))
        {
            throw new NotFoundException(nameof(Candidate), candidateId);
        }

        profile = new CandidateProfile { CandidateId = candidateId };
        context.CandidateProfiles.Add(profile);
        return profile;
    }
}
