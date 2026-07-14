using backend.jobhunter.Application.Common.Exceptions;
using backend.jobhunter.Application.Common.Interfaces;
using backend.jobhunter.Application.Common.Security;
using backend.jobhunter.Domain.Enums;

namespace backend.jobhunter.Application.JobApplications.Commands.UpdateJobApplication;

[Authorize]
public record UpdateJobApplicationCommand : IRequest
{
    public required int Id { get; init; }
    public int? MainContactId { get; init; }
    public required string Status { get; init; }
    public required string Priority { get; init; }
    public DateTimeOffset? AppliedDate { get; init; }
    public DateTimeOffset? NextFollowUpDate { get; init; }
    public string? ResumeVersion { get; init; }
    public string? CoverLetterVersion { get; init; }
    public decimal? ExpectedSalary { get; init; }
    public decimal? ActualOfferSalary { get; init; }
    public string? Currency { get; init; }
    public string? RejectionReason { get; init; }
    public string? Notes { get; init; }
}

public class UpdateJobApplicationCommandHandler(IApplicationDbContext context)
    : IRequestHandler<UpdateJobApplicationCommand>
{
    public async Task Handle(UpdateJobApplicationCommand request, CancellationToken cancellationToken)
    {
        var entity = await context.Applications.FindAsync([request.Id], cancellationToken)
            ?? throw new NotFoundException("JobApplication", request.Id);

        entity.MainContactId = request.MainContactId;
        entity.Status = request.Status;
        entity.Priority = Enum.Parse<PriorityLevel>(request.Priority);
        entity.AppliedDate = request.AppliedDate;
        entity.NextFollowUpDate = request.NextFollowUpDate;
        entity.ResumeVersion = request.ResumeVersion;
        entity.CoverLetterVersion = request.CoverLetterVersion;
        entity.ExpectedSalary = request.ExpectedSalary;
        entity.ActualOfferSalary = request.ActualOfferSalary;
        entity.Currency = request.Currency;
        entity.RejectionReason = request.RejectionReason;
        entity.Notes = request.Notes;
        entity.LastActivityDate = DateTimeOffset.UtcNow;

        await context.SaveChangesAsync(cancellationToken);
    }
}
