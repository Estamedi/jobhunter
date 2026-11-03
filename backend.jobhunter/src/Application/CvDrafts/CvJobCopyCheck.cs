using System.Text.RegularExpressions;
using backend.jobhunter.Application.Common.Interfaces;

namespace backend.jobhunter.Application.CvDrafts;

// Finds text the model copied from the job description. Only long runs count: the prompt tells the
// model to mirror the job's own terms, so a short overlap such as "infrastructure as code with Terraform"
// is intended, but a whole sentence is not. Only the summary and bullets are checked.
public static partial class CvJobCopyCheck
{
    public const int MinCopiedWords = 8;

    [GeneratedRegex(@"[\p{L}\p{N}][\p{L}\p{N}+#/-]*")]
    private static partial Regex WordPattern();

    private static List<string> Words(string text)
        => WordPattern().Matches(text.Replace("**", string.Empty).ToLowerInvariant()).Select(m => m.Value).ToList();

    private static HashSet<string> Grams(string text)
    {
        var words = Words(text);
        var grams = new HashSet<string>();
        for (var i = 0; i + MinCopiedWords <= words.Count; i++)
        {
            grams.Add(string.Join(' ', words.Skip(i).Take(MinCopiedWords)));
        }
        return grams;
    }

    // Wording that is also in the candidate's own background is theirs, not the job's (for example an
    // uploaded CV they already tailored to a similar posting), so it is not reported as copied.
    public static List<string> FindCopiedRuns(GeneratedCvDto cv, string? jobDescription, string? background = null)
    {
        if (string.IsNullOrWhiteSpace(jobDescription)) return [];

        var grams = Grams(jobDescription);
        if (grams.Count == 0) return [];
        if (!string.IsNullOrWhiteSpace(background)) grams.ExceptWith(Grams(background));

        var found = new List<string>();
        var texts = new List<string> { cv.Summary };
        texts.AddRange(cv.Experience.SelectMany(j => j.Bullets));
        foreach (var text in texts)
        {
            var words = Words(text);
            var i = 0;
            while (i + MinCopiedWords <= words.Count)
            {
                if (!grams.Contains(string.Join(' ', words.Skip(i).Take(MinCopiedWords))))
                {
                    i++;
                    continue;
                }

                // Extend the run for as long as the next window is also in the job description.
                var end = i + MinCopiedWords;
                while (end < words.Count && grams.Contains(string.Join(' ', words.Skip(end - MinCopiedWords + 1).Take(MinCopiedWords))))
                {
                    end++;
                }
                found.Add(string.Join(' ', words.Skip(i).Take(end - i)));
                i = end;
            }
        }
        return found.Distinct().ToList();
    }
}
