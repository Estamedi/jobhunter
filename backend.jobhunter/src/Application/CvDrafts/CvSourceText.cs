using backend.jobhunter.Application.Common.Interfaces;
using backend.jobhunter.Domain.Entities;

namespace backend.jobhunter.Application.CvDrafts;

public static class CvSourceText
{
    // Reads the text of the candidate's uploaded CV. An unreadable file must not stop the draft from
    // being written from the profile, so a failure becomes a warning instead of an error.
    public static async Task<string?> ReadAsync(
        Cv? cv, IFileStorage fileStorage, ICvTextExtractor extractor, List<string> warnings, CancellationToken cancellationToken)
    {
        if (cv is null) return null;

        try
        {
            await using var stream = await fileStorage.OpenReadAsync(cv.StorageKey, cancellationToken);
            return await extractor.ExtractTextAsync(stream, cv.FileName, cancellationToken);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            warnings.Add($"Your uploaded CV \"{cv.FileName}\" could not be read, so only your profile was used.");
            return null;
        }
    }
}
