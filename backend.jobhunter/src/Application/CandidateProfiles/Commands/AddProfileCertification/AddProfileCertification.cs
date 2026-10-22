using backend.jobhunter.Application.Common.Interfaces;
using backend.jobhunter.Application.Common.Security;
using backend.jobhunter.Domain.Entities;

namespace backend.jobhunter.Application.CandidateProfiles.Commands.AddProfileCertification;

[Authorize]
public record AddProfileCertificationCommand : IRequest<int>, ICertificationInput
{
    public required int CandidateId { get; init; }
    public required string Name { get; init; }
    public string? Issuer { get; init; }
    public DateOnly? IssuedDate { get; init; }
    public DateOnly? ExpiryDate { get; init; }
    public string? CredentialUrl { get; init; }
}

public class AddProfileCertificationCommandHandler(IApplicationDbContext context)
    : IRequestHandler<AddProfileCertificationCommand, int>
{
    public async Task<int> Handle(AddProfileCertificationCommand request, CancellationToken cancellationToken)
    {
        var profile = await context.GetOrCreateAsync(request.CandidateId, cancellationToken);

        var entity = new ProfileCertification
        {
            Profile = profile,
            Name = request.Name.Trim(),
            Issuer = request.Issuer?.Trim(),
            IssuedDate = request.IssuedDate,
            ExpiryDate = request.ExpiryDate,
            CredentialUrl = request.CredentialUrl?.Trim(),
            SortOrder = profile.Id == 0
                ? 0
                : (await context.ProfileCertifications.Where(x => x.ProfileId == profile.Id)
                    .MaxAsync(x => (int?)x.SortOrder, cancellationToken) ?? -1) + 1,
        };

        context.ProfileCertifications.Add(entity);
        await context.SaveChangesAsync(cancellationToken);

        return entity.Id;
    }
}
