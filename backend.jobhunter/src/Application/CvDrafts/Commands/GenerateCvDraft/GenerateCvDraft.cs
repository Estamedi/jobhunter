using System.Text.Json;
using backend.jobhunter.Application.Common.Interfaces;
using backend.jobhunter.Application.Common.Security;
using backend.jobhunter.Application.CvDrafts.Queries.GetCvDraft;
using backend.jobhunter.Domain.Entities;
using backend.jobhunter.Domain.Enums;

namespace backend.jobhunter.Application.CvDrafts.Commands.GenerateCvDraft;

[Authorize]
public record GenerateCvDraftCommand : IRequest<CvDraftDetailDto>
{
    public required int CandidateId { get; init; }
    public required string JobTitle { get; init; }
    public string? Title { get; init; }
    public string? JobDescription { get; init; }
    public string? Instructions { get; init; }
    public string? BackgroundText { get; init; }
    public int? SourceCvId { get; init; }
    public int? JobApplicationId { get; init; }
    public string? TemplateId { get; init; }
    public string? Tone { get; init; }
    public string? Language { get; init; }
    // CEFR writing level, A2 to C2. Defaults to B2 when not given.
    public string? LanguageLevel { get; init; }
}

// Accepts the request and queues the draft. The AI work runs in CvGenerationWorker, and the draft's
// Status goes Pending, Running, Completed (or Failed). The response comes back at once with the Pending draft.
public class GenerateCvDraftCommandHandler(IApplicationDbContext context, ICvGenerationSignal signal)
    : IRequestHandler<GenerateCvDraftCommand, CvDraftDetailDto>
{
    public async Task<CvDraftDetailDto> Handle(GenerateCvDraftCommand request, CancellationToken cancellationToken)
    {
        var candidateExists = await context.Candidates.AsNoTracking()
            .AnyAsync(c => c.Id == request.CandidateId, cancellationToken);
        if (!candidateExists) throw new NotFoundException(nameof(Candidate), request.CandidateId);

        if (request.SourceCvId.HasValue
            && !await context.Cvs.AsNoTracking().AnyAsync(c => c.Id == request.SourceCvId, cancellationToken))
        {
            throw new NotFoundException(nameof(Cv), request.SourceCvId.Value);
        }

        var jobDescription = request.JobDescription;
        string? company = null;
        if (request.JobApplicationId.HasValue)
        {
            var role = await context.Applications.AsNoTracking()
                .Where(a => a.Id == request.JobApplicationId)
                .Select(a => new { a.JobRole.Description, a.JobRole.Requirements, CompanyName = a.Company.Name })
                .FirstOrDefaultAsync(cancellationToken)
                ?? throw new NotFoundException(nameof(JobApplication), request.JobApplicationId.Value);

            company = role.CompanyName;

            // A draft made from an application is tailored to that job even if the form sent no description.
            if (string.IsNullOrWhiteSpace(jobDescription))
            {
                jobDescription = CvJobPosting.Compose(role.Description, role.Requirements);
            }
        }

        var warnings = new List<string>();
        if (string.IsNullOrWhiteSpace(jobDescription))
        {
            warnings.Add("No job description was given, so this CV is general rather than tailored to a job.");
        }
        else if (jobDescription.Length > CvLimits.MaxFieldLength)
        {
            warnings.Add("The job description was too long, so the end of it was cut off before writing the CV.");
        }
        if (request.Instructions?.Length > CvLimits.MaxFieldLength)
        {
            warnings.Add("Your instructions were too long, so the end of them was cut off before writing the CV.");
        }

        var draft = new CvDraft
        {
            CandidateId = request.CandidateId,
            SourceCvId = request.SourceCvId,
            JobApplicationId = request.JobApplicationId,
            Title = DraftTitle(request.Title, request.JobTitle, company),
            JobTitle = request.JobTitle,
            JobDescription = jobDescription is { Length: > CvLimits.MaxFieldLength }
                ? jobDescription[..CvLimits.MaxFieldLength]
                : jobDescription,
            Instructions = request.Instructions,
            Tone = request.Tone,
            Language = request.Language,
            LanguageLevel = CvLanguageLevel.Normalize(request.LanguageLevel),
            TemplateId = string.IsNullOrWhiteSpace(request.TemplateId) ? "classic" : request.TemplateId,
            ContentJson = CvDraftContent.Serialize(new GeneratedCvDto()),
            Status = CvDraftStatus.Pending,
            GenerationNotes = request.BackgroundText is { Length: > CvLimits.MaxFieldLength }
                ? request.BackgroundText[..CvLimits.MaxFieldLength]
                : request.BackgroundText,
            GenerationWarningsJson = JsonSerializer.Serialize(warnings),
        };

        context.CvDrafts.Add(draft);
        await context.SaveChangesAsync(cancellationToken);

        // Woken after the save, so the worker can already see the row.
        signal.Notify();

        return draft.ToDetailDto(warnings);
    }

    // Named after the job so drafts for different jobs are easy to tell apart: "Job title - Company",
    // the same shape "Write all" uses.
    public static string DraftTitle(string? given, string jobTitle, string? company)
        => !string.IsNullOrWhiteSpace(given) ? given
            : string.IsNullOrWhiteSpace(company) ? jobTitle.Trim()
            : $"{jobTitle.Trim()} - {company.Trim()}";
}

