using backend.jobhunter.Application.Common.Interfaces;
using backend.jobhunter.Application.Common.Security;
using backend.jobhunter.Domain.Entities;

namespace backend.jobhunter.Application.Contacts.Commands.CreateContact;

[Authorize]
public record CreateContactCommand : IRequest<int>
{
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

public class CreateContactCommandHandler(IApplicationDbContext context)
    : IRequestHandler<CreateContactCommand, int>
{
    public async Task<int> Handle(CreateContactCommand request, CancellationToken cancellationToken)
    {
        var entity = new JobContact
        {
            FullName = request.FullName,
            CompanyId = request.CompanyId,
            JobTitle = request.JobTitle,
            Email = request.Email,
            Phone = request.Phone,
            LinkedInUrl = request.LinkedInUrl,
            Type = request.Type,
            Warmth = request.Warmth,
            Notes = request.Notes
        };
        context.Contacts.Add(entity);
        await context.SaveChangesAsync(cancellationToken);
        return entity.Id;
    }
}
