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

        draft.Title = request.Title;
        draft.TemplateId = request.TemplateId;
        draft.ContentJson = CvDraftContent.Serialize(request.Content);

        await context.SaveChangesAsync(cancellationToken);

        return draft.ToDetailDto();
    }
}
