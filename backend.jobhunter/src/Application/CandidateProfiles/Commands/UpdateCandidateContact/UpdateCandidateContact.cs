using backend.jobhunter.Application.Common.Interfaces;
using backend.jobhunter.Application.Common.Security;
using backend.jobhunter.Domain.Entities;

namespace backend.jobhunter.Application.CandidateProfiles.Commands.UpdateCandidateContact;

// The contact details shown in a CV header. Only these fields change, so the rest of the
// candidate record (target roles, notes, ...) is left untouched.
[Authorize]
public record UpdateCandidateContactCommand : IRequest
{
    public required int CandidateId { get; init; }
    public required string FullName { get; init; }
    public required string Email { get; init; }
    public string? Phone { get; init; }
    public string? CurrentLocation { get; init; }
}

public class UpdateCandidateContactCommandHandler(IApplicationDbContext context)
    : IRequestHandler<UpdateCandidateContactCommand>
{
    public async Task Handle(UpdateCandidateContactCommand request, CancellationToken cancellationToken)
    {
        var candidate = await context.Candidates.FindAsync([request.CandidateId], cancellationToken)
            ?? throw new NotFoundException(nameof(Candidate), request.CandidateId);

        candidate.FullName = request.FullName.Trim();
        candidate.Email = request.Email.Trim();
        candidate.Phone = string.IsNullOrWhiteSpace(request.Phone) ? null : request.Phone.Trim();
        candidate.CurrentLocation = string.IsNullOrWhiteSpace(request.CurrentLocation) ? null : request.CurrentLocation.Trim();

        await context.SaveChangesAsync(cancellationToken);
    }
}
