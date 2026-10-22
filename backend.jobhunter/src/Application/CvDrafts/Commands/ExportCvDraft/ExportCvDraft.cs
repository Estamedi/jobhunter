using backend.jobhunter.Application.Common.Interfaces;
using backend.jobhunter.Application.Common.Security;
using backend.jobhunter.Domain.Entities;

namespace backend.jobhunter.Application.CvDrafts.Commands.ExportCvDraft;

[Authorize]
public record ExportCvDraftCommand(int Id) : IRequest<int>;

public class ExportCvDraftCommandHandler(
    IApplicationDbContext context, ICvPdfRenderer renderer, IFileStorage fileStorage)
    : IRequestHandler<ExportCvDraftCommand, int>
{
    public async Task<int> Handle(ExportCvDraftCommand request, CancellationToken cancellationToken)
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
        await context.SaveChangesAsync(cancellationToken);

        return cv.Id;
    }

    private static string SanitizeFileName(string title)
    {
        var invalid = Path.GetInvalidFileNameChars();
        var cleaned = new string(title.Where(c => !invalid.Contains(c)).ToArray()).Trim();
        return cleaned.Length == 0 ? "CV" : cleaned;
    }
}
