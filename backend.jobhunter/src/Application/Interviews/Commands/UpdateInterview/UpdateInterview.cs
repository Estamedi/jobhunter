using backend.jobhunter.Application.Common.Exceptions;
using backend.jobhunter.Application.Common.Interfaces;
using backend.jobhunter.Application.Common.Security;

namespace backend.jobhunter.Application.Interviews.Commands.UpdateInterview;

[Authorize]
public record UpdateInterviewCommand : IRequest
{
    public required int Id { get; init; }
    public string Round { get; init; } = "HR";
    public required DateTimeOffset InterviewDate { get; init; }
    public int? DurationMinutes { get; init; }
    public string? InterviewerName { get; init; }
    public string? InterviewerEmail { get; init; }
    public string? MeetingLink { get; init; }
    public string Status { get; init; } = "Scheduled";
    public string? PreparationNotes { get; init; }
    public string? InterviewNotes { get; init; }
    public string? Feedback { get; init; }
}

public class UpdateInterviewCommandHandler(IApplicationDbContext context)
    : IRequestHandler<UpdateInterviewCommand>
{
    public async Task Handle(UpdateInterviewCommand request, CancellationToken cancellationToken)
    {
        var entity = await context.Interviews.FindAsync([request.Id], cancellationToken)
            ?? throw new NotFoundException("Interview", request.Id);

        entity.Round = request.Round;
        entity.InterviewDate = request.InterviewDate;
        entity.DurationMinutes = request.DurationMinutes;
        entity.InterviewerName = request.InterviewerName;
        entity.InterviewerEmail = request.InterviewerEmail;
        entity.MeetingLink = request.MeetingLink;
        entity.Status = request.Status;
        entity.PreparationNotes = request.PreparationNotes;
        entity.InterviewNotes = request.InterviewNotes;
        entity.Feedback = request.Feedback;

        await context.SaveChangesAsync(cancellationToken);
    }
}
