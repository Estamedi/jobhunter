using backend.jobhunter.Application.Common.Interfaces;
using backend.jobhunter.Application.Common.Security;
using backend.jobhunter.Domain.Entities;
using backend.jobhunter.Domain.Enums;

namespace backend.jobhunter.Application.CandidateProfiles.Commands.ImportProfile;

public record ImportedExperience : IExperienceInput
{
    public required string Title { get; init; }
    public string? EmploymentType { get; init; }
    public required string Company { get; init; }
    public bool IsCurrent { get; init; }
    public required DateOnly StartDate { get; init; }
    public DateOnly? EndDate { get; init; }
    public string? Location { get; init; }
    public string? WorkplaceType { get; init; }
    public string? Description { get; init; }
    public IReadOnlyList<string>? Skills { get; init; }
}

public record ImportedEducation : IEducationInput
{
    public required string Institution { get; init; }
    public required string Degree { get; init; }
    public string? FieldOfStudy { get; init; }
    public string? Location { get; init; }
    public DateOnly? StartDate { get; init; }
    public DateOnly? EndDate { get; init; }
    public string? Details { get; init; }
}

public record ImportedSkill
{
    public required string Name { get; init; }
    public string? Category { get; init; }
}

public record ImportedProject : IProjectInput
{
    public required string Name { get; init; }
    public string? Description { get; init; }
    public string? Url { get; init; }
    public DateOnly? StartDate { get; init; }
    public DateOnly? EndDate { get; init; }
}

public record ImportedCertification : ICertificationInput
{
    public required string Name { get; init; }
    public string? Issuer { get; init; }
    public DateOnly? IssuedDate { get; init; }
    public DateOnly? ExpiryDate { get; init; }
    public string? CredentialUrl { get; init; }
}

public record ImportedLanguage : ILanguageInput
{
    public required string Name { get; init; }
    public required string Proficiency { get; init; }
}

public record ImportedLink : ILinkInput
{
    public required string Label { get; init; }
    public required string Url { get; init; }
}

// Saves the user-reviewed result of a CV import. Mode "Merge" adds the experiences that aren't
// already on the profile and fills the headline/summary only when empty; "Replace" overwrites all.
[Authorize]
public record ImportProfileCommand : IRequest<int>
{
    public required int CandidateId { get; init; }
    public int? CvId { get; init; }
    public string Mode { get; init; } = "Merge";
    public string? Headline { get; init; }
    public string? Summary { get; init; }
    public string? Phone { get; init; }
    public string? CurrentLocation { get; init; }
    public IReadOnlyList<ImportedExperience> Experiences { get; init; } = [];
    public IReadOnlyList<ImportedEducation> Educations { get; init; } = [];
    public IReadOnlyList<ImportedSkill> Skills { get; init; } = [];
    public IReadOnlyList<ImportedProject> Projects { get; init; } = [];
    public IReadOnlyList<ImportedCertification> Certifications { get; init; } = [];
    public IReadOnlyList<ImportedLanguage> Languages { get; init; } = [];
    public IReadOnlyList<ImportedLink> Links { get; init; } = [];
}

public class ImportProfileCommandHandler(IApplicationDbContext context)
    : IRequestHandler<ImportProfileCommand, int>
{
    public async Task<int> Handle(ImportProfileCommand request, CancellationToken cancellationToken)
    {
        if (request.CvId.HasValue
            && !await context.Cvs.AnyAsync(c => c.Id == request.CvId, cancellationToken))
        {
            throw new NotFoundException(nameof(Cv), request.CvId.Value);
        }

        var profile = await context.GetOrCreateAsync(request.CandidateId, cancellationToken);
        var replace = string.Equals(request.Mode, "Replace", StringComparison.OrdinalIgnoreCase);

        var existing = profile.Id == 0
            ? []
            : await context.ProfileExperiences.Where(e => e.ProfileId == profile.Id).ToListAsync(cancellationToken);
        var existingEducations = profile.Id == 0
            ? []
            : await context.ProfileEducations.Where(e => e.ProfileId == profile.Id).ToListAsync(cancellationToken);
        var existingSkills = profile.Id == 0
            ? []
            : await context.ProfileSkills.Where(s => s.ProfileId == profile.Id).ToListAsync(cancellationToken);

        var existingProjects = profile.Id == 0 ? [] : await context.ProfileProjects.Where(x => x.ProfileId == profile.Id).ToListAsync(cancellationToken);
        var existingCertifications = profile.Id == 0 ? [] : await context.ProfileCertifications.Where(x => x.ProfileId == profile.Id).ToListAsync(cancellationToken);
        var existingLanguages = profile.Id == 0 ? [] : await context.ProfileLanguages.Where(x => x.ProfileId == profile.Id).ToListAsync(cancellationToken);
        var existingLinks = profile.Id == 0 ? [] : await context.ProfileLinks.Where(x => x.ProfileId == profile.Id).ToListAsync(cancellationToken);

        if (replace)
        {
            context.ProfileProjects.RemoveRange(existingProjects);
            context.ProfileCertifications.RemoveRange(existingCertifications);
            context.ProfileLanguages.RemoveRange(existingLanguages);
            context.ProfileLinks.RemoveRange(existingLinks);
            existingProjects = [];
            existingCertifications = [];
            existingLanguages = [];
            existingLinks = [];
            context.ProfileExperiences.RemoveRange(existing);
            context.ProfileEducations.RemoveRange(existingEducations);
            context.ProfileSkills.RemoveRange(existingSkills);
            existing = [];
            existingEducations = [];
            existingSkills = [];
            profile.Headline = request.Headline?.Trim();
            profile.Summary = request.Summary?.Trim();
        }
        else
        {
            if (string.IsNullOrWhiteSpace(profile.Headline)) profile.Headline = request.Headline?.Trim();
            if (string.IsNullOrWhiteSpace(profile.Summary)) profile.Summary = request.Summary?.Trim();
        }

        var known = existing.Select(Key).ToHashSet();
        var added = 0;
        foreach (var item in request.Experiences)
        {
            var entity = new ProfileExperience
            {
                Profile = profile,
                Title = item.Title.Trim(),
                EmploymentType = CandidateProfileMapping.ParseEnum<EmploymentType>(item.EmploymentType),
                Company = item.Company.Trim(),
                IsCurrent = item.IsCurrent,
                StartDate = item.StartDate,
                EndDate = item.IsCurrent ? null : item.EndDate,
                Location = item.Location?.Trim(),
                WorkplaceType = CandidateProfileMapping.ParseEnum<WorkplaceType>(item.WorkplaceType),
                Description = item.Description?.Trim(),
                Skills = CandidateProfileMapping.CleanSkills(item.Skills),
            };

            if (!known.Add(Key(entity))) continue;

            context.ProfileExperiences.Add(entity);
            added++;
        }

        var knownEducations = existingEducations
            .Select(e => $"{e.Institution.Trim().ToLowerInvariant()}|{e.Degree.Trim().ToLowerInvariant()}")
            .ToHashSet();
        foreach (var item in request.Educations)
        {
            if (!knownEducations.Add($"{item.Institution.Trim().ToLowerInvariant()}|{item.Degree.Trim().ToLowerInvariant()}"))
            {
                continue;
            }

            context.ProfileEducations.Add(new ProfileEducation
            {
                Profile = profile,
                Institution = item.Institution.Trim(),
                Degree = item.Degree.Trim(),
                FieldOfStudy = item.FieldOfStudy?.Trim(),
                Location = item.Location?.Trim(),
                StartDate = item.StartDate,
                EndDate = item.EndDate,
                Details = item.Details?.Trim(),
            });
        }

        var knownSkills = existingSkills.Select(s => s.Name.Trim().ToLowerInvariant()).ToHashSet();
        var nextSkillOrder = existingSkills.Count == 0 ? 0 : existingSkills.Max(s => s.SortOrder) + 1;
        foreach (var item in request.Skills)
        {
            var name = item.Name.Trim();
            if (!knownSkills.Add(name.ToLowerInvariant())) continue;

            context.ProfileSkills.Add(new ProfileSkill
            {
                Profile = profile,
                Name = name,
                Category = string.IsNullOrWhiteSpace(item.Category) ? null : item.Category.Trim(),
                SortOrder = nextSkillOrder++,
            });
        }

        var knownProjects = existingProjects.Select(x => Norm(x.Name)).ToHashSet();
        var projectOrder = existingProjects.Count == 0 ? 0 : existingProjects.Max(x => x.SortOrder) + 1;
        foreach (var item in request.Projects)
        {
            if (!knownProjects.Add(Norm(item.Name))) continue;
            context.ProfileProjects.Add(new ProfileProject
            {
                Profile = profile,
                Name = item.Name.Trim(),
                Description = item.Description?.Trim(),
                Url = item.Url?.Trim(),
                StartDate = item.StartDate,
                EndDate = item.EndDate,
                SortOrder = projectOrder++,
            });
        }

        var knownCertifications = existingCertifications.Select(x => $"{Norm(x.Name)}|{Norm(x.Issuer)}").ToHashSet();
        var certificationOrder = existingCertifications.Count == 0 ? 0 : existingCertifications.Max(x => x.SortOrder) + 1;
        foreach (var item in request.Certifications)
        {
            if (!knownCertifications.Add($"{Norm(item.Name)}|{Norm(item.Issuer)}")) continue;
            context.ProfileCertifications.Add(new ProfileCertification
            {
                Profile = profile,
                Name = item.Name.Trim(),
                Issuer = item.Issuer?.Trim(),
                IssuedDate = item.IssuedDate,
                ExpiryDate = item.ExpiryDate,
                CredentialUrl = item.CredentialUrl?.Trim(),
                SortOrder = certificationOrder++,
            });
        }

        var knownLanguages = existingLanguages.Select(x => Norm(x.Name)).ToHashSet();
        var languageOrder = existingLanguages.Count == 0 ? 0 : existingLanguages.Max(x => x.SortOrder) + 1;
        foreach (var item in request.Languages)
        {
            if (!knownLanguages.Add(Norm(item.Name))) continue;
            context.ProfileLanguages.Add(new ProfileLanguage
            {
                Profile = profile,
                Name = item.Name.Trim(),
                Proficiency = Enum.Parse<LanguageProficiency>(item.Proficiency, ignoreCase: true),
                SortOrder = languageOrder++,
            });
        }

        var knownLinks = existingLinks.Select(x => Norm(x.Url)).ToHashSet();
        var linkOrder = existingLinks.Count == 0 ? 0 : existingLinks.Max(x => x.SortOrder) + 1;
        foreach (var item in request.Links)
        {
            if (!knownLinks.Add(Norm(item.Url))) continue;
            context.ProfileLinks.Add(new ProfileLink
            {
                Profile = profile,
                Label = item.Label.Trim(),
                Url = item.Url.Trim(),
                SortOrder = linkOrder++,
            });
        }

        // Contact details are only filled in when the candidate has none yet.
        var candidate = await context.Candidates.FirstOrDefaultAsync(c => c.Id == request.CandidateId, cancellationToken);
        if (candidate is not null)
        {
            if (string.IsNullOrWhiteSpace(candidate.Phone) && !string.IsNullOrWhiteSpace(request.Phone))
                candidate.Phone = request.Phone.Trim();
            if (string.IsNullOrWhiteSpace(candidate.CurrentLocation) && !string.IsNullOrWhiteSpace(request.CurrentLocation))
                candidate.CurrentLocation = request.CurrentLocation.Trim();
        }

        profile.ImportedFromCvId = request.CvId;
        profile.LastImportedAt = DateTimeOffset.UtcNow;

        await context.SaveChangesAsync(cancellationToken);
        return added;
    }

    private static string Norm(string? value) => value?.Trim().ToLowerInvariant() ?? string.Empty;

    private static string Key(ProfileExperience e)
        => $"{e.Company.Trim().ToLowerInvariant()}|{e.Title.Trim().ToLowerInvariant()}|{e.StartDate:yyyy-MM}";
}
