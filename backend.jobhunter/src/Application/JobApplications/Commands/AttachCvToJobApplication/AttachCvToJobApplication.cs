using backend.jobhunter.Application.Common.Exceptions;
using backend.jobhunter.Application.Common.Interfaces;
using backend.jobhunter.Application.Common.Security;
using backend.jobhunter.Domain.Entities;

namespace backend.jobhunter.Application.JobApplications.Commands.AttachCvToJobApplication;

// Sets which CV an application was (or will be) sent with, replacing any CV already attached.
[Authorize]
public record AttachCvToJobApplicationCommand : IRequest
{
    public required int Id { get; init; }
    public required int CvId { get; init; }
}

public class AttachCvToJobApplicationCommandHandler(IApplicationDbContext context)
    : IRequestHandler<AttachCvToJobApplicationCommand>
{
    public async Task Handle(AttachCvToJobApplicationCommand request, CancellationToken cancellationToken)
    {
        var application = await context.Applications.FindAsync([request.Id], cancellationToken)
            ?? throw new NotFoundException(nameof(JobApplication), request.Id);

        var cvBelongsToCandidate = await context.Cvs
            .AnyAsync(c => c.Id == request.CvId && c.CandidateId == application.CandidateId, cancellationToken);
        if (!cvBelongsToCandidate)
        {
            throw new NotFoundException(nameof(Cv), request.CvId);
        }

        application.CvId = request.CvId;
        application.LastActivityDate = DateTimeOffset.UtcNow;

        await context.SaveChangesAsync(cancellationToken);
    }
}
