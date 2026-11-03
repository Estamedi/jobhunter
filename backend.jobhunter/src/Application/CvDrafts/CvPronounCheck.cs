using System.Text.RegularExpressions;
using backend.jobhunter.Application.Common.Interfaces;

namespace backend.jobhunter.Application.CvDrafts;

// A CV summary is written without personal pronouns ("He has...", "I build..."). Reports the ones it finds.
public static partial class CvPronounCheck
{
    [GeneratedRegex(@"(?-i:\bI\b(?!/))|\b(me|my|mine|he|she|him|his|her|hers)\b", RegexOptions.IgnoreCase)]
    private static partial Regex PronounPattern();

    public static List<string> Find(GeneratedCvDto cv)
        => PronounPattern().Matches(cv.Summary.Replace("**", string.Empty))
            .Select(m => m.Value.ToLowerInvariant())
            .Distinct()
            .ToList();
}
