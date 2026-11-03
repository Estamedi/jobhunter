using backend.jobhunter.Application.Common.Exceptions;
using backend.jobhunter.Application.Common.Interfaces;
using backend.jobhunter.Application.Common.Security;
using backend.jobhunter.Application.CvDrafts.Queries.GetCvDraft;
using backend.jobhunter.Domain.Entities;
using backend.jobhunter.Domain.Enums;
using FluentValidation.Results;

namespace backend.jobhunter.Application.CvDrafts.Commands.RetryCvDraftGeneration;

// Puts a Failed draft back in the queue. Only a failed draft can be retried.
[Authorize]
public record RetryCvDraftGenerationCommand(int Id) : IRequest<CvDraftDetailDto>;

public class RetryCvDraftGenerationCommandHandler(IApplicationDbContext context, ICvGenerationSignal signal)
    : IRequestHandler<RetryCvDraftGenerationCommand, CvDraftDetailDto>
{
    public async Task<CvDraftDetailDto> Handle(RetryCvDraftGenerationCommand request, CancellationToken cancellationToken)
    {
        var draft = await context.CvDrafts.FindAsync([request.Id], cancellationToken)
            ?? throw new NotFoundException(nameof(CvDraft), request.Id);

        if (draft.Status != CvDraftStatus.Failed)
        {
            throw new Common.Exceptions.ValidationException([new ValidationFailure(nameof(CvDraft.Status), "Only a CV that failed can be retried.")]);
        }

        draft.Status = CvDraftStatus.Pending;
        draft.GenerationError = null;
        draft.GenerationAttempts = 0;
        await context.SaveChangesAsync(cancellationToken);

        signal.Notify();
        return draft.ToDetailDto(CvDraftDetailMapping.StoredWarnings(draft));
    }
}
