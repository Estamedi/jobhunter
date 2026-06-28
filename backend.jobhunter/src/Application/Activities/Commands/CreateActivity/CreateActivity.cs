using backend.jobhunter.Application.Common.Interfaces;
using backend.jobhunter.Application.Common.Security;
using backend.jobhunter.Domain.Entities;

namespace backend.jobhunter.Application.Activities.Commands.CreateActivity;

[Authorize]
public record CreateActivityCommand : IRequest<int>
{
    public required int CandidateId { get; init; }
    public int? ApplicationId { get; init; }
    public int? CompanyId { get; init; }
    public int? ContactId { get; init; }
    public string Type { get; init; } = "Note";
    public DateTimeOffset ActivityDate { get; init; } = DateTimeOffset.UtcNow;
    public string? Outcome { get; init; }
    public string? Notes { get; init; }
}

public class CreateActivityCommandHandler(IApplicationDbContext context)
    : IRequestHandler<CreateActivityCommand, int>
{
    public async Task<int> Handle(CreateActivityCommand request, CancellationToken cancellationToken)
    {
        var entity = new JobActivity
        {
            CandidateId = request.CandidateId,
            ApplicationId = request.ApplicationId,
            CompanyId = request.CompanyId,
            ContactId = request.ContactId,
            Type = request.Type,
            ActivityDate = request.ActivityDate,
            Outcome = request.Outcome,
            Notes = request.Notes
        };

        context.Activities.Add(entity);

        // Update last activity date on the application
        if (request.ApplicationId.HasValue)
        {
            var app = await context.Applications.FindAsync([request.ApplicationId.Value], cancellationToken);
            if (app != null)
                app.LastActivityDate = DateTimeOffset.UtcNow;
        }

        await context.SaveChangesAsync(cancellationToken);
        return entity.Id;
    }
}
