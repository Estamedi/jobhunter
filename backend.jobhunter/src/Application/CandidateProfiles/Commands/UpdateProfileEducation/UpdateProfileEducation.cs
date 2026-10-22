using backend.jobhunter.Application.Common.Interfaces;
using backend.jobhunter.Application.Common.Security;
using backend.jobhunter.Domain.Entities;

namespace backend.jobhunter.Application.CandidateProfiles.Commands.UpdateProfileEducation;

[Authorize]
public record UpdateProfileEducationCommand : IRequest, IEducationInput
{
    public required int Id { get; init; }
    public required string Institution { get; init; }
    public required string Degree { get; init; }
    public string? FieldOfStudy { get; init; }
    public string? Location { get; init; }
    public DateOnly? StartDate { get; init; }
    public DateOnly? EndDate { get; init; }
    public string? Details { get; init; }
}

public class UpdateProfileEducationCommandHandler(IApplicationDbContext context)
    : IRequestHandler<UpdateProfileEducationCommand>
{
    public async Task Handle(UpdateProfileEducationCommand request, CancellationToken cancellationToken)
    {
        var entity = await context.ProfileEducations.FindAsync([request.Id], cancellationToken)
            ?? throw new NotFoundException(nameof(ProfileEducation), request.Id);

        entity.Institution = request.Institution.Trim();
        entity.Degree = request.Degree.Trim();
        entity.FieldOfStudy = request.FieldOfStudy?.Trim();
        entity.Location = request.Location?.Trim();
        entity.StartDate = request.StartDate;
        entity.EndDate = request.EndDate;
        entity.Details = request.Details?.Trim();

        await context.SaveChangesAsync(cancellationToken);
    }
}
