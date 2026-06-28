using backend.jobhunter.Application.Common.Interfaces;
using backend.jobhunter.Application.Common.Security;
using backend.jobhunter.Domain.Entities;

namespace backend.jobhunter.Application.Candidates.Commands.CreateCandidate;

[Authorize]
public record CreateCandidateCommand : IRequest<int>
{
    public required string FullName { get; init; }
    public required string Email { get; init; }
    public string? Phone { get; init; }
    public string? CurrentLocation { get; init; }
    public string? TargetCountries { get; init; }
    public string PreferredWorkType { get; init; } = "Any";
    public string? TargetRoles { get; init; }
    public string? Notes { get; init; }
}

public class CreateCandidateCommandHandler(IApplicationDbContext context)
    : IRequestHandler<CreateCandidateCommand, int>
{
    public async Task<int> Handle(CreateCandidateCommand request, CancellationToken cancellationToken)
    {
        var entity = new Candidate
        {
            FullName = request.FullName,
            Email = request.Email,
            Phone = request.Phone,
            CurrentLocation = request.CurrentLocation,
            TargetCountries = request.TargetCountries,
            PreferredWorkType = request.PreferredWorkType,
            TargetRoles = request.TargetRoles,
            Notes = request.Notes,
            IsActive = true
        };

        context.Candidates.Add(entity);
        await context.SaveChangesAsync(cancellationToken);
        return entity.Id;
    }
}
