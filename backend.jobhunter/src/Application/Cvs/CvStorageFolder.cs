using System.Globalization;
using System.Text;
using System.Text.RegularExpressions;

namespace backend.jobhunter.Application.Cvs;

public static partial class CvStorageFolder
{
    private const int MaxSlugLength = 40;

    // "2-jane-sample": the id keeps the folder unique and stable, the slug makes it findable in the bucket.
    public static string For(int candidateId, string? fullName)
    {
        var slug = Slugify(fullName);
        return slug.Length == 0 ? candidateId.ToString(CultureInfo.InvariantCulture) : $"{candidateId}-{slug}";
    }

    public static string Slugify(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return string.Empty;
        }

        var builder = new StringBuilder();
        foreach (var c in value.Normalize(NormalizationForm.FormD))
        {
            if (CharUnicodeInfo.GetUnicodeCategory(c) != UnicodeCategory.NonSpacingMark)
            {
                builder.Append(c);
            }
        }

        var slug = NonAlphanumeric().Replace(builder.ToString().ToLowerInvariant(), "-").Trim('-');
        return slug.Length > MaxSlugLength ? slug[..MaxSlugLength].Trim('-') : slug;
    }

    [GeneratedRegex("[^a-z0-9]+")]
    private static partial Regex NonAlphanumeric();
}
