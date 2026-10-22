using backend.jobhunter.Application.Common.Interfaces;
using backend.jobhunter.Application.Common.Security;
using backend.jobhunter.Domain.Entities;

namespace backend.jobhunter.Application.CandidateProfiles.Commands.UpdateProfileLink;

[Authorize]
public record UpdateProfileLinkCommand : IRequest, ILinkInput
{
    public required int Id { get; init; }
    public required string Label { get; init; }
    public required string Url { get; init; }
}

public class UpdateProfileLinkCommandHandler(IApplicationDbContext context)
    : IRequestHandler<UpdateProfileLinkCommand>
{
    public async Task Handle(UpdateProfileLinkCommand request, CancellationToken cancellationToken)
    {
        var entity = await context.ProfileLinks.FindAsync([request.Id], cancellationToken)
            ?? throw new NotFoundException(nameof(ProfileLink), request.Id);

        entity.Label = request.Label.Trim();
        entity.Url = request.Url.Trim();

        await context.SaveChangesAsync(cancellationToken);
    }
}
