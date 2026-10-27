using backend.jobhunter.Application.Common.Interfaces;
using backend.jobhunter.Domain.Entities;

namespace backend.jobhunter.Application.CvDrafts;

// Keeps a short history of each draft so edits, refines and restores can be undone.
public static class CvVersioning
{
    public const int MaxVersionsPerDraft = 20;

    // Postgres jsonb rewrites key order and whitespace on the way back, so two stored copies of the same
    // content are not equal as raw text. Round-tripping through the DTO gives one canonical form.
    public static string Normalize(string json) => CvDraftContent.Serialize(CvDraftContent.Deserialize(json));

    public static bool HasChanged(string currentJson, string newJson) => Normalize(currentJson) != Normalize(newJson);

    // How many of the oldest versions must go to stay within the limit after adding one more.
    public static int ExcessAfterAddingOne(int existing, int max = MaxVersionsPerDraft)
        => Math.Max(0, existing + 1 - max);

    // Saves the draft's current content as a version, but only when newContentJson really differs. The
    // version is added to the context but not saved: the caller saves it together with the change.
    public static async Task<CvDraftVersion?> SnapshotAsync(
        IApplicationDbContext context, CvDraft draft, string newContentJson, string reason,
        CancellationToken cancellationToken)
    {
        if (!HasChanged(draft.ContentJson, newContentJson)) return null;

        var existing = await context.CvDraftVersions
            .Where(v => v.CvDraftId == draft.Id)
            .OrderBy(v => v.Id)
            .ToListAsync(cancellationToken);
        var excess = ExcessAfterAddingOne(existing.Count);
        if (excess > 0) context.CvDraftVersions.RemoveRange(existing.Take(excess));

        var version = new CvDraftVersion
        {
            CvDraftId = draft.Id,
            ContentJson = Normalize(draft.ContentJson),
            Reason = reason.Length <= 100 ? reason : reason[..100],
        };
        context.CvDraftVersions.Add(version);

        return version;
    }
}
