using backend.jobhunter.Application.Common.Interfaces;
using backend.jobhunter.Application.Common.Security;
using backend.jobhunter.Application.CvDrafts.Queries.GetCvDraft;
using backend.jobhunter.Domain.Entities;

namespace backend.jobhunter.Application.CvDrafts.Commands.RestoreCvDraftVersion;

[Authorize]
public record RestoreCvDraftVersionCommand(int Id, int VersionId) : IRequest<CvDraftDetailDto>;

public class RestoreCvDraftVersionCommandHandler(IApplicationDbContext context)
    : IRequestHandler<RestoreCvDraftVersionCommand, CvDraftDetailDto>
{
    public async Task<CvDraftDetailDto> Handle(RestoreCvDraftVersionCommand request, CancellationToken cancellationToken)
    {
        var draft = await context.CvDrafts.FindAsync([request.Id], cancellationToken)
            ?? throw new NotFoundException(nameof(CvDraft), request.Id);

        // A version only counts when it belongs to this draft.
        var version = await context.CvDraftVersions
            .FirstOrDefaultAsync(v => v.Id == request.VersionId && v.CvDraftId == draft.Id, cancellationToken)
            ?? throw new NotFoundException(nameof(CvDraftVersion), request.VersionId);

        // The current content is saved first, so the restore itself can be undone.
        var previous = await CvVersioning.SnapshotAsync(
            context, draft, version.ContentJson, "Before restoring an earlier version", cancellationToken);

        draft.ContentJson = CvVersioning.Normalize(version.ContentJson);
        await context.SaveChangesAsync(cancellationToken);

        return draft.ToDetailDto(previousVersionId: previous?.Id);
    }
}
