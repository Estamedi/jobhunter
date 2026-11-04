using backend.jobhunter.Application.CandidateProfiles.Queries.GetProfileImportJob;
using backend.jobhunter.Application.Common.Interfaces;
using backend.jobhunter.Application.Common.Security;
using backend.jobhunter.Domain.Entities;
using backend.jobhunter.Domain.Enums;

namespace backend.jobhunter.Application.CandidateProfiles.Commands.StartProfileImport;

// Queues the AI reading of an uploaded CV and answers at once. One job per CV, so starting twice (a double
// click, a reload) never pays for two AI calls: a job that is waiting, running or finished is returned as it
// is, and only a failed one is put back in the queue.
[Authorize]
public record StartProfileImportCommand(int CvId) : IRequest<ProfileImportJobDto>;

public class StartProfileImportCommandHandler(IApplicationDbContext context, IProfileImportSignal signal)
    : IRequestHandler<StartProfileImportCommand, ProfileImportJobDto>
{
    public async Task<ProfileImportJobDto> Handle(StartProfileImportCommand request, CancellationToken cancellationToken)
    {
        // The owner filter hides another user's CV, so it is a 404 for them.
        var cv = await context.Cvs.AsNoTracking()
            .Where(c => c.Id == request.CvId)
            .Select(c => new { c.Id, c.FileName })
            .FirstOrDefaultAsync(cancellationToken)
            ?? throw new NotFoundException(nameof(Cv), request.CvId);

        var job = await context.ProfileImportJobs.FirstOrDefaultAsync(j => j.CvId == cv.Id, cancellationToken);
        if (job is null)
        {
            job = new ProfileImportJob { CvId = cv.Id };
            context.ProfileImportJobs.Add(job);
        }
        else if (job.Status == ProfileImportStatus.Failed)
        {
            job.Status = ProfileImportStatus.Pending;
            job.Error = null;
            job.Attempts = 0;
        }
        else
        {
            return job.ToDto(cv.FileName);
        }

        await context.SaveChangesAsync(cancellationToken);

        // Woken after the save, so the worker can already see the row.
        signal.Notify();
        return job.ToDto(cv.FileName);
    }
}
