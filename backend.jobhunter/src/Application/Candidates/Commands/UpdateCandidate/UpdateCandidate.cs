using backend.jobhunter.Application.Common.Interfaces;
using backend.jobhunter.Application.Common.Security;
using backend.jobhunter.Application.Common.Exceptions;

namespace backend.jobhunter.Application.Candidates.Commands.UpdateCandidate;

[Authorize]
public record UpdateCandidateCommand : IRequest
{
    public required int Id { get; init; }
    public required string FullName { get; init; }
    public required string Email { get; init; }
    public string? Phone { get; init; }
    public string? CurrentLocation { get; init; }
    public string? TargetCountries { get; init; }
    public string PreferredWorkType { get; init; } = "Any";
    public string? TargetRoles { get; init; }
    public string? Notes { get; init; }
}

public class UpdateCandidateCommandHandler(IApplicationDbContext context)
    : IRequestHandler<UpdateCandidateCommand>
{
    public async Task Handle(UpdateCandidateCommand request, CancellationToken cancellationToken)
    {
        var entity = await context.Candidates.FindAsync([request.Id], cancellationToken)
            ?? throw new NotFoundException("Candidate", request.Id);

        entity.FullName = request.FullName;
        entity.Email = request.Email;
        entity.Phone = request.Phone;
        entity.CurrentLocation = request.CurrentLocation;
        entity.TargetCountries = request.TargetCountries;
        entity.PreferredWorkType = request.PreferredWorkType;
        entity.TargetRoles = request.TargetRoles;
        entity.Notes = request.Notes;

        await context.SaveChangesAsync(cancellationToken);
    }
}
