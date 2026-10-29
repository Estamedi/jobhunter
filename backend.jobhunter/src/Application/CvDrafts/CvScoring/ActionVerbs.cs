using System.Text.RegularExpressions;

namespace backend.jobhunter.Application.CvDrafts;

// What the CV checks know about action verbs, built on ActionVerbData. Checks only ever penalise what is
// known to be weak; a first word that is not in the bank (a technical term, say) is never penalised.
internal static partial class ActionVerbs
{
    // Weak openers and what to write instead. Longer phrases come first so "was responsible for" wins over
    // "responsible for". "led", "managed" and "supported" are deliberately not here: Enhancv's own list uses
    // them while warning against overusing them, so repetition (not use) is what is checked.
    public static readonly (string Phrase, string[] Replacements)[] WeakOpeners =
    [
        ("was responsible for", ["managed", "directed", "oversaw"]),
        ("responsible for", ["managed", "directed", "oversaw"]),
        ("duties included", ["delivered", "managed"]),
        ("was part of", ["contributed to", "joined"]),
        ("put together", ["compiled", "assembled"]),
        ("participated in", ["contributed to", "joined"]),
        ("involved in", ["contributed to", "joined"]),
        ("tasked with", ["delivered", "executed"]),
        ("worked on", ["developed", "executed", "designed"]),
        ("helped", ["assisted", "facilitated"]),
        ("handled", ["administered", "operated"]),
        ("used", ["applied", "adopted"]),
        ("made", ["created", "produced"]),
    ];

    // Verbs that mean nearly the same thing. Using several of one family still reads as repetition. The
    // first four are the resume.io groups that are explicitly lists of synonyms; Build is our own.
    private static readonly string[] SynonymCategories = ["Improved", "Worked on", "Increased", "Reduced"];

    private static readonly string[] BuildFamily =
    [
        "built", "developed", "created", "engineered", "constructed", "coded", "programmed", "architected", "crafted",
    ];

    // Words that are the past tense of one verb and also the base form of another, so tense cannot be told.
    private static readonly HashSet<string> TenseAmbiguous =
    [
        "found", "hit", "set", "put", "cut", "read", "bid", "cast", "shed", "spread", "lead", "led", "shaped", "hosted",
    ];

    // Declared first: static fields start in the order they are written, and the tables below use it.
    private static readonly Dictionary<string, string> Irregular = new()
    {
        ["built"] = "build", ["rebuilt"] = "rebuild", ["drove"] = "drive", ["made"] = "make", ["overcame"] = "overcome",
        ["oversaw"] = "oversee", ["shrunk"] = "shrink", ["taught"] = "teach", ["troubleshot"] = "troubleshoot",
        ["undertook"] = "undertake", ["led"] = "lead",
    };

    private static readonly Dictionary<string, string> PastToCategory = ActionVerbData.Verbs
        .ToDictionary(v => v.Past, v => v.Category);

    private static readonly Dictionary<string, string> FamilyByPast = BuildFamilies();

    // Present-tense spellings, reached by trimming "-ed" (and adding back an "e" or undoing a doubled
    // consonant), mapped to the past form. Permissive on purpose: it is only used with other evidence.
    private static readonly Dictionary<string, string> PresentToPast = BuildPresentForms();

    public static bool IsKnown(string word) => PastToCategory.ContainsKey(word);

    public static string? FamilyOf(string word)
    {
        var past = ToPast(word);
        return past is not null && FamilyByPast.TryGetValue(past, out var family) ? family : null;
    }

    // True for "Lead the team" or "Build pipelines": a known verb written in the present tense.
    public static bool IsPresentTense(string word)
        => !PastToCategory.ContainsKey(word) && !TenseAmbiguous.Contains(word) && PresentToPast.ContainsKey(word);

    // Up to `count` verbs from the same family as `word` that the CV has not used yet, always in the same order.
    public static IReadOnlyList<string> Suggest(string word, IEnumerable<string> alreadyUsed, int count = 3)
    {
        var past = ToPast(word);
        if (past is null || !FamilyByPast.TryGetValue(past, out var family)) return [];
        var used = alreadyUsed.Select(u => ToPast(u) ?? u).ToHashSet();
        return FamilyByPast
            .Where(f => f.Value == family && !used.Contains(f.Key))
            .Select(f => f.Key)
            .Order()
            .Take(count)
            .ToList();
    }

    // "was developed", "were completed": the bullet says what happened, not who did it.
    public static bool IsPassive(string text) => PassiveOpener().IsMatch(text);

    private static string? ToPast(string word)
        => PastToCategory.ContainsKey(word) ? word : PresentToPast.GetValueOrDefault(word);

    private static Dictionary<string, string> BuildFamilies()
    {
        var map = new Dictionary<string, string>();
        foreach (var (past, category, _) in ActionVerbData.Verbs)
        {
            if (SynonymCategories.Contains(category)) map[past] = category;
        }
        foreach (var verb in BuildFamily) map[verb] = "Build";
        return map;
    }

    private static Dictionary<string, string> BuildPresentForms()
    {
        var map = new Dictionary<string, string>();
        foreach (var (past, _, _) in ActionVerbData.Verbs)
        {
            foreach (var form in PresentCandidates(past)) map.TryAdd(form, past);
        }
        return map;
    }

    private static IEnumerable<string> PresentCandidates(string past)
    {
        if (Irregular.TryGetValue(past, out var irregular))
        {
            yield return irregular;
            yield break;
        }
        if (past.EndsWith("ied")) { yield return past[..^3] + "y"; yield break; }
        if (!past.EndsWith("ed")) yield break;

        var stem = past[..^2];
        yield return stem;
        yield return stem + "e";
        if (stem.Length > 2 && stem[^1] == stem[^2]) yield return stem[..^1];
    }

    [GeneratedRegex(@"^(was|were)\s+(\w+ed|built|made|done|given|taken|written|led|run|held|sold|won|chosen|driven|known|seen)\b",
        RegexOptions.IgnoreCase)]
    private static partial Regex PassiveOpener();
}
