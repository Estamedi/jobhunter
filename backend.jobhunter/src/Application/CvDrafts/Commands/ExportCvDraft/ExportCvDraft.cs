using backend.jobhunter.Application.Common.Interfaces;
using backend.jobhunter.Application.Common.Security;
using System.Text.RegularExpressions;
using backend.jobhunter.Domain.Entities;

namespace backend.jobhunter.Application.CvDrafts.Commands.ExportCvDraft;

// AttachedApplicationId is set when the draft is linked to an application that had no CV yet and the
// PDF was attached to it. ExistingCvKept is true when the application already has a CV, which is
// left in place so a CV that was already sent is never replaced silently.
public record ExportCvDraftResult(int CvId, int? AttachedApplicationId, bool ExistingCvKept);

[Authorize]
// Format is "pdf" (default) or "docx".
public record ExportCvDraftCommand(int Id, string Format = "pdf") : IRequest<ExportCvDraftResult>;

public class ExportCvDraftCommandHandler(
    IApplicationDbContext context, ICvPdfRenderer renderer, ICvDocxRenderer docxRenderer, IFileStorage fileStorage)
    : IRequestHandler<ExportCvDraftCommand, ExportCvDraftResult>
{
    public async Task<ExportCvDraftResult> Handle(ExportCvDraftCommand request, CancellationToken cancellationToken)
    {
        var draft = await context.CvDrafts.AsNoTracking().Include(d => d.Candidate)
            .FirstOrDefaultAsync(d => d.Id == request.Id, cancellationToken)
            ?? throw new NotFoundException(nameof(CvDraft), request.Id);

        var candidate = draft.Candidate;
        var header = new CvHeaderDto(candidate.FullName, candidate.Email, candidate.Phone, candidate.CurrentLocation);
        var content = CvDraftContent.Deserialize(draft.ContentJson);
        var isDocx = string.Equals(request.Format, "docx", StringComparison.OrdinalIgnoreCase);
        var pdf = isDocx ? docxRenderer.Render(header, content) : renderer.Render(draft.TemplateId, header, content);

        var fileName = BuildFileName(candidate.FullName, string.IsNullOrWhiteSpace(draft.JobTitle) ? draft.Title : draft.JobTitle, isDocx ? "docx" : "pdf");
        await using var stream = new MemoryStream(pdf);
        var storageKey = await fileStorage.SaveAsync(stream, fileName, cancellationToken);

        var cv = new Cv
        {
            CandidateId = draft.CandidateId,
            FileName = fileName,
            ContentType = isDocx
                ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                : "application/pdf",
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

    // Standard CV file name: First-Last-Role-CV.pdf or .docx (hyphen separated, no spaces or special characters).
    private static string BuildFileName(string fullName, string jobTitle, string extension)
    {
        var words = Regex.Split($"{fullName} {jobTitle}", @"[^\p{L}\p{N}]+")
            .Where(w => w.Length > 0)
            .Select(w => w.Length > 1 && w.Any(char.IsUpper) ? w : char.ToUpperInvariant(w[0]) + w[1..]);
        return $"{string.Join('-', words)}-CV.{extension}";
    }
}
