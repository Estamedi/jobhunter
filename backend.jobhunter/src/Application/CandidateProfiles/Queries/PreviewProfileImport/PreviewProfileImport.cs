using backend.jobhunter.Application.Common.Interfaces;
using backend.jobhunter.Application.Common.Security;
using backend.jobhunter.Domain.Entities;

namespace backend.jobhunter.Application.CandidateProfiles.Queries.PreviewProfileImport;

// Reads an uploaded CV and returns what the AI found. Nothing is saved; the user reviews it first.
[Authorize]
public record PreviewProfileImportQuery(int CvId) : IRequest<ParsedProfileDto>;

public class PreviewProfileImportQueryHandler(
    IApplicationDbContext context,
    IFileStorage fileStorage,
    ICvTextExtractor textExtractor,
    IProfileImportAiService aiService)
    : IRequestHandler<PreviewProfileImportQuery, ParsedProfileDto>
{
    public async Task<ParsedProfileDto> Handle(PreviewProfileImportQuery request, CancellationToken cancellationToken)
    {
        var cv = await context.Cvs.AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == request.CvId, cancellationToken)
            ?? throw new NotFoundException(nameof(Cv), request.CvId);

        await using var stream = await fileStorage.OpenReadAsync(cv.StorageKey, cancellationToken);
        var text = await textExtractor.ExtractTextAsync(stream, cv.FileName, cancellationToken);

        return await aiService.ParseAsync(text, cancellationToken);
    }
}
