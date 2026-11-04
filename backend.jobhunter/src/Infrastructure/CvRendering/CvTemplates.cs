namespace backend.jobhunter.Infrastructure.CvRendering;

public static class CvTemplates
{
    // The default template, modelled on the owner's reference CV.
    public const string Classic = "classic";
    // The classic layout in near-black, for print and grayscale.
    public const string Neutral = "neutral";
    // Tighter spacing and slightly smaller type in neutral colours.
    public const string Compact = "compact";

    public static readonly string[] All = [Classic, Neutral, Compact];
}
