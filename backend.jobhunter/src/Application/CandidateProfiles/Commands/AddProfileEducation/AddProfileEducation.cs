using backend.jobhunter.Application.Common.Interfaces;
using backend.jobhunter.Application.Common.Security;
using backend.jobhunter.Domain.Entities;

namespace backend.jobhunter.Application.CandidateProfiles.Commands.AddProfileEducation;

[Authorize]
public record AddProfileEducationCommand : IRequest<int>, IEducationInput
{
    public required int CandidateId { get; init; }
    public required string Institution { get; init; }
    public required string Degree { get; init; }
    public string? FieldOfStudy { get; init; }
    public string? Location { get; init; }
    public DateOnly? StartDate { get; init; }
    public DateOnly? EndDate { get; init; }
    public string? Details { get; init; }
}

public class AddProfileEducationCommandHandler(IApplicationDbContext context)
    : IRequestHandler<AddProfileEducationCommand, int>
{
    public async Task<int> Handle(AddProfileEducationCommand request, CancellationToken cancellationToken)
    {
        var profile = await context.GetOrCreateAsync(request.CandidateId, cancellationToken);

        var entity = new ProfileEducation
        {
            Profile = profile,
            Institution = request.Institution.Trim(),
            Degree = request.Degree.Trim(),
            FieldOfStudy = request.FieldOfStudy?.Trim(),
            Location = request.Location?.Trim(),
            StartDate = request.StartDate,
            EndDate = request.EndDate,
            Details = request.Details?.Trim(),
        };

        context.ProfileEducations.Add(entity);
        await context.SaveChangesAsync(cancellationToken);

        return entity.Id;
    }
}
