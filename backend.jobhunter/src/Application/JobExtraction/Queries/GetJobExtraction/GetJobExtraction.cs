using backend.jobhunter.Application.Common.Exceptions;
using backend.jobhunter.Application.Common.Interfaces;
using backend.jobhunter.Application.Common.Security;

namespace backend.jobhunter.Application.JobExtraction.Queries.GetJobExtraction;

[Authorize]
public record GetJobExtractionQuery(string Url) : IRequest<JobExtractionStatusDto>;

public class GetJobExtractionQueryHandler(IJobExtractionQueue queue, IUser user)
    : IRequestHandler<GetJobExtractionQuery, JobExtractionStatusDto>
{
    public Task<JobExtractionStatusDto> Handle(GetJobExtractionQuery request, CancellationToken cancellationToken)
        => Task.FromResult(queue.Get(user.Id!, request.Url)
            ?? new JobExtractionStatusDto { Status = "Failed", Error = "No extraction is running for this page. Try again." });
}
