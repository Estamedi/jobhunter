using backend.jobhunter.Application.Common.Interfaces;
using backend.jobhunter.Application.Common.Security;
using backend.jobhunter.Domain.Entities;

namespace backend.jobhunter.Application.Interviews.Commands.CreateInterview;

[Authorize]
public record CreateInterviewCommand : IRequest<int>
{
    public required int ApplicationId { get; init; }
    public required int CandidateId { get; init; }
    public required int CompanyId { get; init; }
    public string Round { get; init; } = "HR";
    public required DateTimeOffset InterviewDate { get; init; }
    public int? DurationMinutes { get; init; }
    public string? InterviewerName { get; init; }
    public string? InterviewerEmail { get; init; }
    public string? MeetingLink { get; init; }
    public string Status { get; init; } = "Scheduled";
    public string? PreparationNotes { get; init; }
}

public class CreateInterviewCommandHandler(IApplicationDbContext context)
    : IRequestHandler<CreateInterviewCommand, int>
{
    public async Task<int> Handle(CreateInterviewCommand request, CancellationToken cancellationToken)
    {
        var entity = new JobInterview
        {
            ApplicationId = request.ApplicationId,
            CandidateId = request.CandidateId,
            CompanyId = request.CompanyId,
            Round = request.Round,
            InterviewDate = request.InterviewDate,
            DurationMinutes = request.DurationMinutes,
            InterviewerName = request.InterviewerName,
            InterviewerEmail = request.InterviewerEmail,
            MeetingLink = request.MeetingLink,
            Status = request.Status,
            PreparationNotes = request.PreparationNotes
        };
        context.Interviews.Add(entity);
        await context.SaveChangesAsync(cancellationToken);
        return entity.Id;
    }
}
