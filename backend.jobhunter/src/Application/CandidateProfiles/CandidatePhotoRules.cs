namespace backend.jobhunter.Application.CandidateProfiles;

// What a CV photo may be. The browser scales and crops it first, so a real photo is far below the limit.
public static class CandidatePhotoRules
{
    public const int MaxBytes = 2 * 1024 * 1024;

    // The type comes from the file's own first bytes, not from the name or the type the browser sent.
    public static string? ContentTypeOf(ReadOnlySpan<byte> header)
    {
        if (header.Length >= 3 && header[0] == 0xFF && header[1] == 0xD8 && header[2] == 0xFF) return "image/jpeg";
        if (header.Length >= 8 && header[..8].SequenceEqual(new byte[] { 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A })) return "image/png";
        return null;
    }
}
