using backend.jobhunter.Application.Common.Interfaces;
using backend.jobhunter.Application.Common.Security;
using backend.jobhunter.Domain.Entities;

namespace backend.jobhunter.Application.CandidateProfiles.Commands.UpdateProfileCertification;

[Authorize]
public record UpdateProfileCertificationCommand : IRequest, ICertificationInput
{
    public required int Id { get; init; }
    public required string Name { get; init; }
    public string? Issuer { get; init; }
    public DateOnly? IssuedDate { get; init; }
    public DateOnly? ExpiryDate { get; init; }
    public string? CredentialUrl { get; init; }
}

public class UpdateProfileCertificationCommandHandler(IApplicationDbContext context)
    : IRequestHandler<UpdateProfileCertificationCommand>
{
    public async Task Handle(UpdateProfileCertificationCommand request, CancellationToken cancellationToken)
    {
        var entity = await context.ProfileCertifications.FindAsync([request.Id], cancellationToken)
            ?? throw new NotFoundException(nameof(ProfileCertification), request.Id);

        entity.Name = request.Name.Trim();
        entity.Issuer = request.Issuer?.Trim();
        entity.IssuedDate = request.IssuedDate;
        entity.ExpiryDate = request.ExpiryDate;
        entity.CredentialUrl = request.CredentialUrl?.Trim();

        await context.SaveChangesAsync(cancellationToken);
    }
}
