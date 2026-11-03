using System.Text.RegularExpressions;
using backend.jobhunter.Application.Common.Interfaces;
using static backend.jobhunter.Application.CvDrafts.CvScoreText;

namespace backend.jobhunter.Application.CvDrafts;

// Empty phrases recruiters skip, plus overused verbs and AI-sounding words, looked for in the summary and
// every bullet. The verb and word lists come from resume-builder-skill and claude-resume-kit (see
// docs/cv-builder/cv-banned-verbs.md and docs/cv-builder/cv-banned-words.md); keep them in step with CvGenerationPrompt.
internal sealed partial class BuzzwordsCheck : ICvScoreCheck
{
    private static readonly string[] Buzzwords =
    [
        "team player", "hard-working", "hardworking", "results-driven", "results-oriented", "go-getter",
        "self-starter", "detail-oriented", "think outside the box", "synergy", "dynamic", "passionate",
        "motivated", "people person", "fast learner", "strong work ethic",
    ];

    // Weak and superfluous verbs, in the forms a bullet uses. Only forms that cannot be a noun are listed
    // ("engineers" and "engineering" are fine, "engineered" is not).
    private static readonly string[] BannedVerbs =
    [
        "responsible for", "helped", "worked on", "assisted", "handled", "participated in", "was involved in",
        "amplified", "conceptualized", "crafted", "elevated", "employed", "engaged", "engineered", "ensured",
        "fostered", "headed", "honed", "innovated", "mastered", "perfected", "pioneered", "revolutionized",
        "spearheaded", "transformed",
        "enhance", "enhances", "enhanced", "enhancing", "leverage", "leverages", "leveraged", "leveraging",
        "utilize", "utilizes", "utilized", "utilizing", "orchestrate", "orchestrates", "orchestrated",
        "orchestrating", "foster", "fosters", "fostering", "harness", "harnesses", "harnessed", "harnessing",
        "facilitate", "facilitates", "facilitated", "facilitating", "showcase", "showcases", "showcased",
        "showcasing", "bolster", "bolsters", "bolstered", "bolstering", "underscore", "underscores",
        "underscored", "underscoring", "spearhead", "spearheads", "spearheading", "delve", "delves", "delved",
        "delving", "embark", "embarks", "embarked", "embarking",
    ];

    // AI-sounding adjectives, adverbs, nouns and phrases. "landscape" and "journey" are left out because
    // they are only a problem when used as metaphors, which a word list cannot tell apart.
    private static readonly string[] BannedWords =
    [
        "robust", "comprehensive", "innovative", "pivotal", "meticulous", "diverse", "extensive", "multifaceted",
        "holistic", "nuanced", "cutting-edge", "novel", "groundbreaking", "meticulously", "notably",
        "subsequently", "remarkably", "seamlessly", "thereby", "tapestry", "realm", "paradigm", "cornerstone",
        "in today's rapidly evolving", "at the forefront of", "it is worth noting that", "proven track record",
        "passionate about", "demonstrated ability to", "strong foundation in", "well-versed in", "adept at",
        "groundbreaking research", "cutting-edge methodology", "novel approach",
        "significant contributions to the field", "at the intersection of",
    ];

    private static readonly Regex VerbPattern = WordsPattern(BannedVerbs);
    private static readonly Regex WordPattern = WordsPattern(BannedWords);

    private static Regex WordsPattern(IEnumerable<string> words)
        => new($@"\b(?:{string.Join("|", words.OrderByDescending(w => w.Length).Select(Regex.Escape))})\b",
            RegexOptions.IgnoreCase | RegexOptions.CultureInvariant);

    public int Weight => 8;

    public CvScoreCheckDto Run(GeneratedCvDto cv)
    {
        var issues = new List<CvScoreIssueDto>();
        var summary = Clean(cv.Summary);
        var texts = new List<(CvScoreLocationDto Where, string Text)> { (new("summary", null, null, summary), summary) };
        texts.AddRange(Bullets(cv).Select(b => (At(b), b.Text)));

        foreach (var (where, text) in texts)
        {
            var lower = text.ToLowerInvariant();
            foreach (var word in Buzzwords.Where(w => lower.Contains(w)))
            {
                issues.Add(new($"\"{word}\" is a cliché recruiters skip. Show it with a result instead.", [where]));
            }

            foreach (var match in VerbPattern.Matches(text).Select(m => m.Value.ToLowerInvariant()).Distinct())
            {
                issues.Add(new($"\"{match}\" is a weak or overused verb. Use a plainer, specific one.", [where]));
            }

            foreach (var match in WordPattern.Matches(text).Select(m => m.Value.ToLowerInvariant()).Distinct())
            {
                issues.Add(new($"\"{match}\" sounds machine-written. Say what was actually done.", [where]));
            }
        }

        return new("buzzwords", "Buzzwords", "Replace empty phrases with proof.",
            Penalty(issues.Count, 2.5), null, issues);
    }
}
