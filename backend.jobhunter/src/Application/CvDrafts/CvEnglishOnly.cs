using System.Text.RegularExpressions;

namespace backend.jobhunter.Application.CvDrafts;

// The CV is single-language (English). Profile rows sometimes carry a second-language copy of a name,
// e.g. "Andishe Computer (رتویپماک هشیدنا)"; this drops any Arabic-script text and the brackets left empty.
public static partial class CvEnglishOnly
{
    [GeneratedRegex(@"[؀-ۿݐ-ݿࢠ-ࣿﭐ-﷿ﹰ-﻿‌‏‎]+")]
    private static partial Regex NonLatinScript();

    [GeneratedRegex(@"\(\s*\)|\[\s*\]")]
    private static partial Regex EmptyBrackets();

    [GeneratedRegex(@"\s{2,}")]
    private static partial Regex Spaces();

    [GeneratedRegex(@"\s+([,;.])")]
    private static partial Regex SpaceBeforePunctuation();

    public static string? Clean(string? text)
    {
        if (string.IsNullOrEmpty(text) || !NonLatinScript().IsMatch(text)) return text;
        var result = NonLatinScript().Replace(text, " ");
        result = EmptyBrackets().Replace(result, " ");
        result = Spaces().Replace(result, " ");
        result = SpaceBeforePunctuation().Replace(result, "$1");
        return result.Trim(' ', ',', ';', '-', '|');
    }
}
