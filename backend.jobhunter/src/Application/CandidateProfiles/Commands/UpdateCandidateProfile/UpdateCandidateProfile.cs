using backend.jobhunter.Application.Common.Interfaces;
using backend.jobhunter.Application.Common.Security;

namespace backend.jobhunter.Application.CandidateProfiles.Commands.UpdateCandidateProfile;

[Authorize]
public record UpdateCandidateProfileCommand : IRequest<int>
{
    public required int CandidateId { get; init; }
    public string? Headline { get; init; }
    public string? Summary { get; init; }
}

public class UpdateCandidateProfileCommandHandler(IApplicationDbContext context)
    : IRequestHandler<UpdateCandidateProfileCommand, int>
{
    public async Task<int> Handle(UpdateCandidateProfileCommand request, CancellationToken cancellationToken)
    {
        var profile = await context.GetOrCreateAsync(request.CandidateId, cancellationToken);

        profile.Headline = request.Headline?.Trim();
        profile.Summary = request.Summary?.Trim();

        await context.SaveChangesAsync(cancellationToken);
        return profile.Id;
    }
}
