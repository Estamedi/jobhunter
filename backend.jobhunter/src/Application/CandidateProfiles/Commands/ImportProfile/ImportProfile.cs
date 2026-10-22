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
    public IReadOnlyList<ImportedExperience> Experiences { get; init; } = [];
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

        if (replace)
        {
            context.ProfileExperiences.RemoveRange(existing);
            existing = [];
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

        profile.ImportedFromCvId = request.CvId;
        profile.LastImportedAt = DateTimeOffset.UtcNow;

        await context.SaveChangesAsync(cancellationToken);
        return added;
    }

    private static string Key(ProfileExperience e)
        => $"{e.Company.Trim().ToLowerInvariant()}|{e.Title.Trim().ToLowerInvariant()}|{e.StartDate:yyyy-MM}";
}
