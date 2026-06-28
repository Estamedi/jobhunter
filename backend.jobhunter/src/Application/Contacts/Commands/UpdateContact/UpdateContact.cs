using backend.jobhunter.Application.Common.Exceptions;
using backend.jobhunter.Application.Common.Interfaces;
using backend.jobhunter.Application.Common.Security;

namespace backend.jobhunter.Application.Contacts.Commands.UpdateContact;

[Authorize]
public record UpdateContactCommand : IRequest
{
    public required int Id { get; init; }
    public required string FullName { get; init; }
    public required int CompanyId { get; init; }
    public string? JobTitle { get; init; }
    public string? Email { get; init; }
    public string? Phone { get; init; }
    public string? LinkedInUrl { get; init; }
    public string Type { get; init; } = "Other";
    public string Warmth { get; init; } = "Cold";
    public string? Notes { get; init; }
}

public class UpdateContactCommandHandler(IApplicationDbContext context)
    : IRequestHandler<UpdateContactCommand>
{
    public async Task Handle(UpdateContactCommand request, CancellationToken cancellationToken)
    {
        var entity = await context.Contacts.FindAsync([request.Id], cancellationToken)
            ?? throw new NotFoundException("Contact", request.Id);

        entity.FullName = request.FullName;
        entity.CompanyId = request.CompanyId;
        entity.JobTitle = request.JobTitle;
        entity.Email = request.Email;
        entity.Phone = request.Phone;
        entity.LinkedInUrl = request.LinkedInUrl;
        entity.Type = request.Type;
        entity.Warmth = request.Warmth;
        entity.Notes = request.Notes;

        await context.SaveChangesAsync(cancellationToken);
    }
}
