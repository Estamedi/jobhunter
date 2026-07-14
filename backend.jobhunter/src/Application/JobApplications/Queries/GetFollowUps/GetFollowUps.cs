using backend.jobhunter.Application.Common.Interfaces;
using backend.jobhunter.Application.Common.Security;

namespace backend.jobhunter.Application.JobApplications.Queries.GetFollowUps;

public enum FollowUpFilter { Today, Overdue, ThisWeek }

public record FollowUpApplicationDto(
    int Id, int CandidateId, string CandidateName,
    int CompanyId, string CompanyName, string JobRoleTitle,
    string Status, string Priority,
    DateTimeOffset? NextFollowUpDate, DateTimeOffset? AppliedDate
);

[Authorize]
public record GetFollowUpsQuery(FollowUpFilter Filter) : IRequest<IReadOnlyList<FollowUpApplicationDto>>;

public class GetFollowUpsQueryHandler(IApplicationDbContext context)
    : IRequestHandler<GetFollowUpsQuery, IReadOnlyList<FollowUpApplicationDto>>
{
    public async Task<IReadOnlyList<FollowUpApplicationDto>> Handle(GetFollowUpsQuery request, CancellationToken cancellationToken)
    {
        var now = DateTimeOffset.UtcNow;
        var today = now.Date;
        var weekEnd = now.AddDays(7);

        var query = context.Applications.AsNoTracking();

        query = request.Filter switch
        {
            FollowUpFilter.Today => query.Where(a => a.NextFollowUpDate.HasValue && a.NextFollowUpDate.Value.Date == today),
            FollowUpFilter.Overdue => query.Where(a => a.NextFollowUpDate.HasValue && a.NextFollowUpDate.Value < now && a.NextFollowUpDate.Value.Date != today),
            FollowUpFilter.ThisWeek => query.Where(a => a.NextFollowUpDate.HasValue && a.NextFollowUpDate.Value > now && a.NextFollowUpDate.Value <= weekEnd),
            _ => query
        };

        return await query
            .OrderBy(a => a.NextFollowUpDate)
            .Select(a => new FollowUpApplicationDto(
                a.Id, a.CandidateId, a.Candidate.FullName,
                a.CompanyId, a.Company.Name, a.JobRole.Title,
                a.Status, a.Priority.ToString(),
                a.NextFollowUpDate, a.AppliedDate))
            .ToListAsync(cancellationToken);
    }
}
