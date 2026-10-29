using backend.jobhunter.Application.Common.Interfaces;
using backend.jobhunter.Application.Common.Security;
using backend.jobhunter.Domain.Entities;

namespace backend.jobhunter.Application.CvDrafts.Queries.GetCvDraftScore;

// Scores the draft as it is saved now, so it can be asked for again after every edit.
[Authorize]
public record GetCvDraftScoreQuery(int Id) : IRequest<CvScoreDto>;

public class GetCvDraftScoreQueryHandler(IApplicationDbContext context)
    : IRequestHandler<GetCvDraftScoreQuery, CvScoreDto>
{
    public async Task<CvScoreDto> Handle(GetCvDraftScoreQuery request, CancellationToken cancellationToken)
    {
        var draft = await context.CvDrafts.AsNoTracking()
            .FirstOrDefaultAsync(d => d.Id == request.Id, cancellationToken)
            ?? throw new NotFoundException(nameof(CvDraft), request.Id);

        return CvScorer.Score(CvDraftContent.Deserialize(draft.ContentJson));
    }
}
