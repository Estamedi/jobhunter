using backend.jobhunter.Application.Common.Exceptions;
using backend.jobhunter.Application.Common.Interfaces;
using backend.jobhunter.Application.Common.Security;
using backend.jobhunter.Domain.Entities;

namespace backend.jobhunter.Application.OnboardingPreferences.Queries.GetCandidatePreferences;

public record CandidatePreferencesDto(
    int CandidateId,
    string? WorkStatus,
    string? SearchIntensity,
    string? PrimaryGoal,
    int? MinSalary,
    string? SalaryCurrency,
    string[] EmploymentTypes,
    string[] WorkModes,
    bool? WillingToRelocate,
    string[] RemoteRegions,
    string[] CommuteCities,
    string? WorkAuthorization,
    string[] Industries
);

[Authorize]
public record GetCandidatePreferencesQuery(int CandidateId) : IRequest<CandidatePreferencesDto>;

public class GetCandidatePreferencesQueryHandler(IApplicationDbContext context)
    : IRequestHandler<GetCandidatePreferencesQuery, CandidatePreferencesDto>
{
    public async Task<CandidatePreferencesDto> Handle(GetCandidatePreferencesQuery request, CancellationToken cancellationToken)
    {
        var p = await context.CandidatePreferences.AsNoTracking()
            .FirstOrDefaultAsync(p => p.CandidateId == request.CandidateId, cancellationToken);

        if (p is not null) return p.ToDto();

        if (!await context.Candidates.AnyAsync(c => c.Id == request.CandidateId, cancellationToken))
        {
            throw new NotFoundException(nameof(Candidate), request.CandidateId);
        }

        // Nothing answered yet: an empty set is returned and created on the first save.
        return new CandidatePreferencesDto(request.CandidateId, null, null, null, null, null, [], [], null, [], [], null, []);
    }
}

public static class CandidatePreferencesMapping
{
    public static string[] Split(string? value) =>
        string.IsNullOrWhiteSpace(value)
            ? []
            : value.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

    public static string? Join(IEnumerable<string>? values)
    {
        var list = values?.Select(v => v.Trim().Replace(",", " ")).Where(v => v.Length > 0).Distinct().ToArray();
        return list is { Length: > 0 } ? string.Join(',', list) : null;
    }

    public static CandidatePreferencesDto ToDto(this CandidatePreferences p) => new(
        p.CandidateId, p.WorkStatus, p.SearchIntensity, p.PrimaryGoal, p.MinSalary, p.SalaryCurrency,
        Split(p.EmploymentTypes), Split(p.WorkModes), p.WillingToRelocate, Split(p.RemoteRegions),
        Split(p.CommuteCities), p.WorkAuthorization, Split(p.Industries));
}
