using backend.jobhunter.Application.Common.Interfaces;
using backend.jobhunter.Application.Common.Security;
using backend.jobhunter.Domain.Entities;

namespace backend.jobhunter.Application.CvDrafts.Commands.ExportCvDraft;

// AttachedApplicationId is set when the draft is linked to an application that had no CV yet and the
// PDF was attached to it. ExistingCvKept is true when the application already has a CV, which is
// left in place so a CV that was already sent is never replaced silently.
public record ExportCvDraftResult(int CvId, int? AttachedApplicationId, bool ExistingCvKept);

[Authorize]
public record ExportCvDraftCommand(int Id) : IRequest<ExportCvDraftResult>;

public class ExportCvDraftCommandHandler(
    IApplicationDbContext context, ICvPdfRenderer renderer, IFileStorage fileStorage)
    : IRequestHandler<ExportCvDraftCommand, ExportCvDraftResult>
{
    public async Task<ExportCvDraftResult> Handle(ExportCvDraftCommand request, CancellationToken cancellationToken)
    {
        var draft = await context.CvDrafts.AsNoTracking().Include(d => d.Candidate)
            .FirstOrDefaultAsync(d => d.Id == request.Id, cancellationToken)
            ?? throw new NotFoundException(nameof(CvDraft), request.Id);

        var candidate = draft.Candidate;
        var pdf = renderer.Render(
            draft.TemplateId,
            new CvHeaderDto(candidate.FullName, candidate.Email, candidate.Phone, candidate.CurrentLocation),
            CvDraftContent.Deserialize(draft.ContentJson));

        var fileName = $"{SanitizeFileName(draft.Title)}.pdf";
        await using var stream = new MemoryStream(pdf);
        var storageKey = await fileStorage.SaveAsync(stream, fileName, cancellationToken);

        var cv = new Cv
        {
            CandidateId = draft.CandidateId,
            FileName = fileName,
            ContentType = "application/pdf",
            FileSizeBytes = pdf.LongLength,
            StorageKey = storageKey,
        };

        context.Cvs.Add(cv);

        int? attachedTo = null;
        var existingKept = false;
        if (draft.JobApplicationId is int applicationId)
        {
            var application = await context.Applications
                .FirstOrDefaultAsync(a => a.Id == applicationId, cancellationToken);

            if (application is not null && application.CvId is null)
            {
                application.Cv = cv;
                application.LastActivityDate = DateTimeOffset.UtcNow;
                attachedTo = application.Id;
            }
            else if (application is not null)
            {
                existingKept = true;
            }
        }

        await context.SaveChangesAsync(cancellationToken);

        return new ExportCvDraftResult(cv.Id, attachedTo, existingKept);
    }

    private static string SanitizeFileName(string title)
    {
        var invalid = Path.GetInvalidFileNameChars();
        var cleaned = new string(title.Where(c => !invalid.Contains(c)).ToArray()).Trim();
        return cleaned.Length == 0 ? "CV" : cleaned;
    }
}
