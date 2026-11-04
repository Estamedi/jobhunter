namespace backend.jobhunter.Infrastructure.CvRendering;

// Colours, type sizes and spacing of a CV. The layout is the same for every style (single column, no
// tables, same section order), so each one reads the same way in an ATS.
public sealed record CvStyle(
    string Id,
    string HeadingColor,
    string CompanyColor,
    string NameColor,
    string MutedColor,
    string BodyColor,
    float BodySize,
    float NameSize,
    float HeadlineSize,
    float SectionTitleSize,
    float DateSize,
    float MarginInches,
    float LineHeight,
    float BlockSpacing,
    float ExperienceSpacing);

public static class CvStyles
{
    // The owner's reference CV. Existing drafts all use it, so its values must not change.
    public static readonly CvStyle Classic = new(
        CvTemplates.Classic, HeadingColor: "#4285F4", CompanyColor: "#1155CC", NameColor: "#353744", MutedColor: "#404040",
        BodyColor: "#000000", BodySize: 10.5f, NameSize: 16f, HeadlineSize: 11.5f, SectionTitleSize: 11.5f, DateSize: 9f,
        MarginInches: 0.75f, LineHeight: 1.24f, BlockSpacing: 6f, ExperienceSpacing: 8f);

    // Same layout in near-black and dark grey, for print and grayscale.
    public static readonly CvStyle Neutral = Classic with
    {
        Id = CvTemplates.Neutral, HeadingColor = "#1F1F1F", CompanyColor = "#333333", NameColor = "#1F1F1F",
    };

    // Neutral colours with tighter spacing and slightly smaller type, to fit more on a page. Body text stays at 10 pt.
    public static readonly CvStyle Compact = Neutral with
    {
        Id = CvTemplates.Compact, BodySize = 10f, NameSize = 15f, HeadlineSize = 11f, SectionTitleSize = 11f, DateSize = 9f,
        MarginInches = 0.6f, LineHeight = 1.18f, BlockSpacing = 4f, ExperienceSpacing = 5f,
    };

    public static CvStyle For(string? templateId) => templateId switch
    {
        CvTemplates.Neutral => Neutral,
        CvTemplates.Compact => Compact,
        _ => Classic,
    };
}
