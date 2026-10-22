using backend.jobhunter.Application.Common.Interfaces;
using backend.jobhunter.Application.Common.Security;
using backend.jobhunter.Domain.Entities;

namespace backend.jobhunter.Application.CandidateProfiles.Commands.AddProfileLink;

[Authorize]
public record AddProfileLinkCommand : IRequest<int>, ILinkInput
{
    public required int CandidateId { get; init; }
    public required string Label { get; init; }
    public required string Url { get; init; }
}

public class AddProfileLinkCommandHandler(IApplicationDbContext context)
    : IRequestHandler<AddProfileLinkCommand, int>
{
    public async Task<int> Handle(AddProfileLinkCommand request, CancellationToken cancellationToken)
    {
        var profile = await context.GetOrCreateAsync(request.CandidateId, cancellationToken);

        var entity = new ProfileLink
        {
            Profile = profile,
            Label = request.Label.Trim(),
            Url = request.Url.Trim(),
            SortOrder = profile.Id == 0
                ? 0
                : (await context.ProfileLinks.Where(x => x.ProfileId == profile.Id)
                    .MaxAsync(x => (int?)x.SortOrder, cancellationToken) ?? -1) + 1,
        };

        context.ProfileLinks.Add(entity);
        await context.SaveChangesAsync(cancellationToken);

        return entity.Id;
    }
}
