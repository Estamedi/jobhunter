using backend.jobhunter.Application.Common.Interfaces;
using backend.jobhunter.Application.Common.Security;
using backend.jobhunter.Domain.Entities;
using backend.jobhunter.Domain.Enums;

namespace backend.jobhunter.Application.CandidateProfiles.Commands.UpdateProfileExperience;

[Authorize]
public record UpdateProfileExperienceCommand : IRequest, IExperienceInput
{
    public required int Id { get; init; }
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

public class UpdateProfileExperienceCommandHandler(IApplicationDbContext context)
    : IRequestHandler<UpdateProfileExperienceCommand>
{
    public async Task Handle(UpdateProfileExperienceCommand request, CancellationToken cancellationToken)
    {
        var entity = await context.ProfileExperiences.FindAsync([request.Id], cancellationToken)
            ?? throw new NotFoundException(nameof(ProfileExperience), request.Id);

        entity.Title = request.Title.Trim();
        entity.EmploymentType = CandidateProfileMapping.ParseEnum<EmploymentType>(request.EmploymentType);
        entity.Company = request.Company.Trim();
        entity.IsCurrent = request.IsCurrent;
        entity.StartDate = request.StartDate;
        entity.EndDate = request.IsCurrent ? null : request.EndDate;
        entity.Location = request.Location?.Trim();
        entity.WorkplaceType = CandidateProfileMapping.ParseEnum<WorkplaceType>(request.WorkplaceType);
        entity.Description = request.Description?.Trim();
        entity.Skills = CandidateProfileMapping.CleanSkills(request.Skills);

        await context.SaveChangesAsync(cancellationToken);
    }
}
