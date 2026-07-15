using backend.jobhunter.Application.Common.Interfaces;
using backend.jobhunter.Application.Common.Security;
using backend.jobhunter.Domain.Entities;
using backend.jobhunter.Domain.Enums;

namespace backend.jobhunter.Application.JobApplications.Commands.CreateJobApplication;

[Authorize]
public record CreateJobApplicationCommand : IRequest<int>
{
    public required int CandidateId { get; init; }
    public required int JobRoleId { get; init; }
    public required int CompanyId { get; init; }
    public int? MainContactId { get; init; }
    public int? CvId { get; init; }
    public string Status { get; init; } = "Wishlist";
    public string Priority { get; init; } = "Medium";
    public DateTimeOffset? AppliedDate { get; init; }
    public DateTimeOffset? NextFollowUpDate { get; init; }
    public string? ResumeVersion { get; init; }
    public string? CoverLetterVersion { get; init; }
    public decimal? ExpectedSalary { get; init; }
    public string? Currency { get; init; }
    public string? Notes { get; init; }
}

public class CreateJobApplicationCommandHandler(IApplicationDbContext context)
    : IRequestHandler<CreateJobApplicationCommand, int>
{
    public async Task<int> Handle(CreateJobApplicationCommand request, CancellationToken cancellationToken)
    {
        var entity = new JobApplication
        {
            CandidateId = request.CandidateId,
            JobRoleId = request.JobRoleId,
            CompanyId = request.CompanyId,
            MainContactId = request.MainContactId,
            CvId = request.CvId,
            Status = request.Status,
            Priority = Enum.Parse<PriorityLevel>(request.Priority),
            AppliedDate = request.AppliedDate,
            LastActivityDate = DateTimeOffset.UtcNow,
            NextFollowUpDate = request.NextFollowUpDate,
            ResumeVersion = request.ResumeVersion,
            CoverLetterVersion = request.CoverLetterVersion,
            ExpectedSalary = request.ExpectedSalary,
            Currency = request.Currency,
            Notes = request.Notes
        };
        context.Applications.Add(entity);
        await context.SaveChangesAsync(cancellationToken);
        return entity.Id;
    }
}
