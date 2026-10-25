using backend.jobhunter.Application.OnboardingPreferences.Queries.GetCandidatePreferences;
using backend.jobhunter.Application.Common.Exceptions;
using backend.jobhunter.Application.Common.Interfaces;
using backend.jobhunter.Application.Common.Security;
using backend.jobhunter.Domain.Entities;

namespace backend.jobhunter.Application.OnboardingPreferences.Commands.SaveCandidatePreferences;

[Authorize]
public record SaveCandidatePreferencesCommand : IRequest
{
    public required int CandidateId { get; init; }
    public string? WorkStatus { get; init; }
    public string? SearchIntensity { get; init; }
    public string? PrimaryGoal { get; init; }
    public int? MinSalary { get; init; }
    public string? SalaryCurrency { get; init; }
    public string[]? EmploymentTypes { get; init; }
    public string[]? WorkModes { get; init; }
    public bool? WillingToRelocate { get; init; }
    public string[]? RemoteRegions { get; init; }
    public string[]? CommuteCities { get; init; }
    public string? WorkAuthorization { get; init; }
    public string[]? Industries { get; init; }
}

public class SaveCandidatePreferencesCommandValidator : AbstractValidator<SaveCandidatePreferencesCommand>
{
    public SaveCandidatePreferencesCommandValidator()
    {
        RuleFor(v => v.MinSalary).GreaterThanOrEqualTo(0).When(v => v.MinSalary.HasValue);
        RuleFor(v => v.SalaryCurrency).Length(3).When(v => !string.IsNullOrEmpty(v.SalaryCurrency));
        RuleFor(v => v.WorkStatus).MaximumLength(50);
        RuleFor(v => v.SearchIntensity).MaximumLength(50);
        RuleFor(v => v.PrimaryGoal).MaximumLength(50);
        RuleFor(v => v.WorkAuthorization).MaximumLength(50);
    }
}

public class SaveCandidatePreferencesCommandHandler(IApplicationDbContext context)
    : IRequestHandler<SaveCandidatePreferencesCommand>
{
    public async Task Handle(SaveCandidatePreferencesCommand request, CancellationToken cancellationToken)
    {
        // The Candidates owner filter limits this to the signed-in user's own candidate.
        if (!await context.Candidates.AnyAsync(c => c.Id == request.CandidateId, cancellationToken))
        {
            throw new NotFoundException(nameof(Candidate), request.CandidateId);
        }

        var p = await context.CandidatePreferences
            .FirstOrDefaultAsync(p => p.CandidateId == request.CandidateId, cancellationToken);

        if (p is null)
        {
            p = new CandidatePreferences { CandidateId = request.CandidateId };
            context.CandidatePreferences.Add(p);
        }

        p.WorkStatus = request.WorkStatus;
        p.SearchIntensity = request.SearchIntensity;
        p.PrimaryGoal = request.PrimaryGoal;
        p.MinSalary = request.MinSalary;
        p.SalaryCurrency = request.SalaryCurrency?.ToUpperInvariant();
        p.EmploymentTypes = CandidatePreferencesMapping.Join(request.EmploymentTypes);
        p.WorkModes = CandidatePreferencesMapping.Join(request.WorkModes);
        p.WillingToRelocate = request.WillingToRelocate;
        p.RemoteRegions = CandidatePreferencesMapping.Join(request.RemoteRegions);
        p.CommuteCities = CandidatePreferencesMapping.Join(request.CommuteCities);
        p.WorkAuthorization = request.WorkAuthorization;
        p.Industries = CandidatePreferencesMapping.Join(request.Industries);

        await context.SaveChangesAsync(cancellationToken);
    }
}
