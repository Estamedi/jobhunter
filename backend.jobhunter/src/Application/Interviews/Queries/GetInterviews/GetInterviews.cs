using backend.jobhunter.Application.Common.Interfaces;
using backend.jobhunter.Application.Common.Security;

namespace backend.jobhunter.Application.Interviews.Queries.GetInterviews;

public record InterviewDto(
    int Id, int ApplicationId, int CandidateId, string CandidateName,
    int CompanyId, string CompanyName,
    string Round, DateTimeOffset InterviewDate, int? DurationMinutes,
    string? InterviewerName, string? MeetingLink, string Status,
    string? PreparationNotes, string? InterviewNotes, string? Feedback,
    DateTimeOffset Created
);

public record GetInterviewsResult(IReadOnlyList<InterviewDto> Items, int Total);

[Authorize]
public record GetInterviewsQuery(
    int? CandidateId = null,
    int? ApplicationId = null,
    int? CompanyId = null,
    string? Status = null,
    bool UpcomingOnly = false,
    int Page = 1,
    int PageSize = 50
) : IRequest<GetInterviewsResult>;

public class GetInterviewsQueryHandler(IApplicationDbContext context)
    : IRequestHandler<GetInterviewsQuery, GetInterviewsResult>
{
    public async Task<GetInterviewsResult> Handle(GetInterviewsQuery request, CancellationToken cancellationToken)
    {
        var query = context.Interviews.AsNoTracking();

        if (request.CandidateId.HasValue)
            query = query.Where(i => i.CandidateId == request.CandidateId.Value);
        if (request.ApplicationId.HasValue)
            query = query.Where(i => i.ApplicationId == request.ApplicationId.Value);
        if (request.CompanyId.HasValue)
            query = query.Where(i => i.CompanyId == request.CompanyId.Value);
        if (!string.IsNullOrWhiteSpace(request.Status))
            query = query.Where(i => i.Status == request.Status);
        if (request.UpcomingOnly)
            query = query.Where(i => i.InterviewDate >= DateTimeOffset.UtcNow && i.Status == "Scheduled");

        var total = await query.CountAsync(cancellationToken);
        var items = await query
            .OrderBy(i => i.InterviewDate)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(i => new InterviewDto(
                i.Id, i.ApplicationId, i.CandidateId, i.Candidate.FullName,
                i.CompanyId, i.Company.Name,
                i.Round, i.InterviewDate, i.DurationMinutes,
                i.InterviewerName, i.MeetingLink, i.Status,
                i.PreparationNotes, i.InterviewNotes, i.Feedback,
                i.Created))
            .ToListAsync(cancellationToken);

        return new GetInterviewsResult(items, total);
    }
}
