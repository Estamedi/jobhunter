using backend.jobhunter.Application.Common.Interfaces;
using backend.jobhunter.Application.Common.Security;
using backend.jobhunter.Domain.Entities;
using backend.jobhunter.Domain.Enums;

namespace backend.jobhunter.Application.CandidateProfiles.Commands.AddProfileExperience;

[Authorize]
public record AddProfileExperienceCommand : IRequest<int>, IExperienceInput
{
    public required int CandidateId { get; init; }
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

public class AddProfileExperienceCommandHandler(IApplicationDbContext context)
    : IRequestHandler<AddProfileExperienceCommand, int>
{
    public async Task<int> Handle(AddProfileExperienceCommand request, CancellationToken cancellationToken)
    {
        var profile = await context.GetOrCreateAsync(request.CandidateId, cancellationToken);

        var entity = new ProfileExperience
        {
            Profile = profile,
            Title = request.Title.Trim(),
            EmploymentType = CandidateProfileMapping.ParseEnum<EmploymentType>(request.EmploymentType),
            Company = request.Company.Trim(),
            IsCurrent = request.IsCurrent,
            StartDate = request.StartDate,
            EndDate = request.IsCurrent ? null : request.EndDate,
            Location = request.Location?.Trim(),
            WorkplaceType = CandidateProfileMapping.ParseEnum<WorkplaceType>(request.WorkplaceType),
            Description = request.Description?.Trim(),
            Skills = CandidateProfileMapping.CleanSkills(request.Skills),
        };

        context.ProfileExperiences.Add(entity);
        await context.SaveChangesAsync(cancellationToken);

        return entity.Id;
    }
}
