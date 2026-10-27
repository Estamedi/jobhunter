using backend.jobhunter.Application.Common.Interfaces;
using backend.jobhunter.Application.Common.Security;
using backend.jobhunter.Application.CvDrafts.Queries.GetCvDraft;
using backend.jobhunter.Domain.Entities;

namespace backend.jobhunter.Application.CvDrafts.Commands.UpdateCvDraft;

[Authorize]
public record UpdateCvDraftCommand : IRequest<CvDraftDetailDto>
{
    public required int Id { get; init; }
    public required string Title { get; init; }
    public required string TemplateId { get; init; }
    public required GeneratedCvDto Content { get; init; }
}

public class UpdateCvDraftCommandHandler(IApplicationDbContext context)
    : IRequestHandler<UpdateCvDraftCommand, CvDraftDetailDto>
{
    public async Task<CvDraftDetailDto> Handle(UpdateCvDraftCommand request, CancellationToken cancellationToken)
    {
        var draft = await context.CvDrafts.FindAsync([request.Id], cancellationToken)
            ?? throw new NotFoundException(nameof(CvDraft), request.Id);

        var newContentJson = CvDraftContent.Serialize(request.Content);
        var previous = await CvVersioning.SnapshotAsync(
            context, draft, newContentJson, "Before editing by hand", cancellationToken);

        draft.Title = request.Title;
        draft.TemplateId = request.TemplateId;
        draft.ContentJson = newContentJson;

        await context.SaveChangesAsync(cancellationToken);

        return draft.ToDetailDto(previousVersionId: previous?.Id);
    }
}
