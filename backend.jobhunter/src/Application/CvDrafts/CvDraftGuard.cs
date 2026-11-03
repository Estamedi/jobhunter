using backend.jobhunter.Domain.Entities;
using backend.jobhunter.Domain.Enums;
using FluentValidation.Results;

namespace backend.jobhunter.Application.CvDrafts;

public static class CvDraftGuard
{
    // A draft that is still being written (or failed) has no content to edit, export or score.
    public static void EnsureCompleted(CvDraft draft)
    {
        if (draft.Status == CvDraftStatus.Completed) return;

        var message = draft.Status == CvDraftStatus.Failed
            ? "This CV could not be written. Try again first."
            : "This CV is still being written. Wait until it is ready.";
        throw new Common.Exceptions.ValidationException([new ValidationFailure(nameof(CvDraft.Status), message)]);
    }
}
