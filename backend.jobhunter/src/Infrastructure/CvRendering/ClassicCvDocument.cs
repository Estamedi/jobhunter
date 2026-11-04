using backend.jobhunter.Application.Common.Interfaces;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace backend.jobhunter.Infrastructure.CvRendering;

// Single-column CV: centred header, blue section headings, bulleted skills and experience with
// dates right-aligned. Layout and palette follow the owner's reference CV (A4, Carlito (Calibri-metric) 10.5pt, 0.75in margins, single column per resume-builder-skill).
public class ClassicCvDocument(CvHeaderDto header, GeneratedCvDto cv, CvStyle? style = null) : IDocument
{
    private readonly CvStyle _s = style ?? CvStyles.Classic;

    public DocumentMetadata GetMetadata() => new()
    {
        Title = $"{header.FullName} - CV",
        Author = header.FullName,
        Subject = CleanText(cv.Headline),
        Keywords = Keywords(cv),
    };

    private static string CleanText(string? value) => (value ?? string.Empty).Replace("**", string.Empty).Trim();

    // Skill names for the PDF's keyword field, without bold markers, at most 20.
    public static string Keywords(GeneratedCvDto cv)
        => string.Join(", ", cv.Skills.SelectMany(g => g.Items)
            .Select(CleanText).Where(k => k.Length > 0)
            .Distinct(StringComparer.OrdinalIgnoreCase).Take(20));

    // The profile link that goes in the header next to the contact details: LinkedIn if there is one,
    // otherwise the first link. It is then left out of "Additional Information" so it is not shown twice.
    public static string? HeaderLink(GeneratedCvDto cv)
        => cv.Links.FirstOrDefault(l => l.Contains("linkedin.com", StringComparison.OrdinalIgnoreCase))
           ?? cv.Links.FirstOrDefault(l => !string.IsNullOrWhiteSpace(l));

    public static List<string> OtherLinks(GeneratedCvDto cv)
    {
        var header = HeaderLink(cv);
        return cv.Links.Where(l => !string.Equals(l, header, StringComparison.Ordinal)).ToList();
    }

    public static string LinkUrl(string link)
        => link.StartsWith("http", StringComparison.OrdinalIgnoreCase) ? link : $"https://{link}";

    public static string LinkText(string link)
    {
        var text = link.Trim();
        foreach (var scheme in new[] { "https://", "http://" })
        {
            if (text.StartsWith(scheme, StringComparison.OrdinalIgnoreCase)) text = text[scheme.Length..];
        }
        return text.TrimEnd('/');
    }

    public void Compose(IDocumentContainer container)
    {
        container.Page(page =>
        {
            page.Size(PageSizes.A4);
            page.Margin(_s.MarginInches, Unit.Inch);
            page.DefaultTextStyle(t => t.FontFamily("Carlito", "Noto Sans Arabic").FontSize(_s.BodySize).FontColor(_s.BodyColor).LineHeight(_s.LineHeight));

            page.Content().Column(col =>
            {
                col.Spacing(_s.BlockSpacing);
                col.Item().Element(_s.PhotoHeader ? PhotoHeader : Header);

                if (!string.IsNullOrWhiteSpace(cv.Summary))
                {
                    col.Item().Element(c => Section(c, "Summary", s =>
                        s.Item().Text(t => t.AppendRich(cv.Summary))));
                }

                if (cv.Skills.Count > 0)
                {
                    col.Item().Element(c => Section(c, "Technical Skills", s =>
                    {
                        foreach (var group in cv.Skills)
                        {
                            s.Item().Element(b => Bullet(b, t =>
                            {
                                if (!string.IsNullOrWhiteSpace(group.Category)) t.Span($"{group.Category}: ").Bold();
                                t.Span(string.Join(", ", group.Items).Replace("**", ""));
                            }));
                        }
                    }));
                }

                if (cv.Experience.Count > 0)
                {
                    col.Item().Element(c => Section(c, "Professional Experience", s =>
                    {
                        s.Spacing(_s.ExperienceSpacing);
                        foreach (var job in cv.Experience) s.Item().Element(e => Experience(e, job));
                    }));
                }

                if (cv.Projects.Count > 0)
                {
                    col.Item().Element(c => Section(c, "Projects", s =>
                    {
                        foreach (var project in cv.Projects)
                        {
                            s.Item().Text(t =>
                            {
                                t.Span(project.Name).Bold();
                                if (!string.IsNullOrWhiteSpace(project.Description)) t.AppendRich($" - {project.Description}");
                                if (!string.IsNullOrWhiteSpace(project.Url)) t.Hyperlink($" {project.Url}", project.Url).FontColor(_s.CompanyColor).Underline();
                            });
                        }
                    }));
                }

                if (cv.Education.Count > 0)
                {
                    col.Item().Element(c => Section(c, "Education", s =>
                    {
                        foreach (var edu in cv.Education)
                        {
                            s.Item().Column(e =>
                            {
                                e.Item().Text(edu.Institution);
                                e.Item().Text(t =>
                                {
                                    t.Span(edu.Degree);
                                    var dates = DateRange(edu.StartDate, edu.EndDate);
                                    if (dates.Length > 0) t.Span($", {dates}");
                                    if (!string.IsNullOrWhiteSpace(edu.Details)) t.Span($" ({edu.Details})");
                                });
                            });
                        }
                    }));
                }

                if (cv.Certifications.Count > 0)
                {
                    col.Item().Element(c => Section(c, "Certifications", s =>
                    {
                        foreach (var cert in cv.Certifications) s.Item().Element(b => Bullet(b, t => t.Span(cert)));
                    }));
                }

                var otherLinks = OtherLinks(cv);
                if (otherLinks.Count > 0 || cv.Languages.Count > 0)
                {
                    col.Item().Element(c => Section(c, "Additional Information", s =>
                    {
                        foreach (var link in otherLinks)
                        {
                            s.Item().Text(t => t.Hyperlink(link, LinkUrl(link))
                                .FontColor(_s.CompanyColor).Underline());
                        }
                        if (cv.Languages.Count > 0)
                        {
                            s.Item().PaddingTop(2).Text(t =>
                            {
                                t.Span("Languages: ").Bold();
                                t.Span(string.Join(", ", cv.Languages));
                            });
                        }
                    }));
                }
            });
        });
    }

    // The photo on the left, then the name, the headline and labelled contact lines, then a QR code of the
    // profile link. A missing photo or link just leaves its place out. The link is also written as text,
    // because an ATS cannot read a QR code.
    private void PhotoHeader(IContainer container)
    {
        const float photoWidth = 90, photoHeight = 120, qrSize = 82;
        var photo = CvImages.UsablePhoto(header.Photo);
        var link = HeaderLink(cv);
        var qr = link is null ? null : CvImages.QrCodePng(LinkUrl(link));

        container.Row(row =>
        {
            row.Spacing(14);

            if (photo is not null) row.ConstantItem(photoWidth).Height(photoHeight).Image(photo).FitArea();

            row.RelativeItem().Column(col =>
            {
                col.Item().Text(header.FullName).FontSize(17).FontColor(_s.NameColor);
                if (!string.IsNullOrWhiteSpace(CleanText(cv.Headline)))
                {
                    col.Item().Text(CleanText(cv.Headline)).FontSize(17).Bold().FontColor(_s.BodyColor);
                }

                void Line(string label, string? value)
                {
                    if (string.IsNullOrWhiteSpace(value)) return;
                    col.Item().Text(t =>
                    {
                        t.DefaultTextStyle(x => x.FontColor(_s.MutedColor));
                        t.Span($"{label}: ");
                        t.Span(value.Trim()).Bold();
                    });
                }

                Line("Residence", header.Location);
                Line("Phone", header.Phone);
                Line("Email", header.Email);
                Line("Availability", header.Availability);
                if (link is not null)
                {
                    col.Item().Text(t =>
                    {
                        t.DefaultTextStyle(x => x.FontColor(_s.MutedColor));
                        t.Span(link.Contains("linkedin.com", StringComparison.OrdinalIgnoreCase) ? "LinkedIn: " : "Link: ");
                        t.Hyperlink(LinkText(link), LinkUrl(link)).Bold();
                    });
                }
            });

            if (qr is not null) row.ConstantItem(qrSize).Height(qrSize).AlignTop().Image(qr).FitArea();
        });
    }

    private void Header(IContainer container)
    {
        container.AlignCenter().Column(col =>
        {
            col.Item().AlignCenter().Text(header.FullName).FontSize(_s.NameSize).FontColor(_s.NameColor);
            if (!string.IsNullOrWhiteSpace(cv.Headline))
            {
                col.Item().AlignCenter().Text(cv.Headline).FontSize(_s.HeadlineSize).Bold().FontColor(_s.NameColor);
            }

            // "Muscat, Oman | (+968) ... | email" with bold values and no labels (ATS friendly).
            var contact = new[] { ("Location", header.Location), ("Phone", header.Phone), ("Email", header.Email) }
                .Where(c => !string.IsNullOrWhiteSpace(c.Item2))
                .ToList();
            var link = HeaderLink(cv);
            if (contact.Count > 0 || link is not null)
            {
                col.Item().PaddingTop(2).AlignCenter().Text(t =>
                {
                    t.DefaultTextStyle(x => x.FontSize(_s.BodySize).FontColor(_s.MutedColor));
                    for (var i = 0; i < contact.Count; i++)
                    {
                        if (i > 0) t.Span(" |  ");
                        t.Span(contact[i].Item2!.Trim()).Bold();
                    }
                    if (link is not null)
                    {
                        if (contact.Count > 0) t.Span(" |  ");
                        t.Hyperlink(LinkText(link), LinkUrl(link)).Bold();
                    }
                });
            }
        });
    }

    private void Section(IContainer container, string title, Action<ColumnDescriptor> body)
    {
        // A section that does not fit whole on the page starts there only if there is room for its heading and
        // the first lines (70 pt). Otherwise it moves to the next page, so a heading is never left alone at the
        // bottom. (QuestPDF applies the minimum only to an element that has to split, so it is set on the whole
        // section and not on the heading, which always fits.)
        container.EnsureSpace(70).Column(col =>
        {
            col.Spacing(2);
            col.Item().PaddingTop(2).Text(title).FontSize(_s.SectionTitleSize).Bold().FontColor(_s.HeadingColor);
            col.Item().Column(body);
        });
    }

    private static void Bullet(IContainer container, Action<TextDescriptor> text)
    {
        container.Row(row =>
        {
            row.ConstantItem(16).AlignCenter().Text("•");
            row.RelativeItem().Text(text);
        });
    }

    private void Experience(IContainer container, CvExperienceDto job)
    {
        container.Column(col =>
        {
            // The role line and its first bullet stay together, so a role never starts alone at the bottom of a
            // page. Only this small block is kept whole; a long role may still continue on the next page.
            col.Item().ShowEntire().Column(first =>
            {
                first.Item().Row(row =>
                {
                    row.RelativeItem().Text(t =>
                    {
                        t.Span(string.IsNullOrWhiteSpace(job.Location) ? job.Company : $"{job.Company}, {job.Location}")
                            .Bold().FontColor(_s.CompanyColor);
                        if (!string.IsNullOrWhiteSpace(job.Role)) t.Span($", {job.Role}").Italic().FontColor(_s.MutedColor);
                    });
                    var dates = ExperienceRange(job.StartDate, job.EndDate);
                    if (dates.Length > 0) row.AutoItem().Text(dates).FontColor(_s.MutedColor).FontSize(_s.DateSize);
                });

                if (job.Bullets.Count > 0) first.Item().Element(b => Bullet(b, t => t.AppendRich(job.Bullets[0])));
            });

            foreach (var bullet in job.Bullets.Skip(1))
            {
                col.Item().Element(b => Bullet(b, t => t.AppendRich(bullet)));
            }
        });
    }

    internal static string DateRange(string? start, string? end)
    {
        var from = start?.Trim();
        var to = string.IsNullOrWhiteSpace(end) ? (string.IsNullOrWhiteSpace(from) ? null : "Present") : end.Trim();
        return string.Join(" \u2013 ", new[] { from, to }.Where(v => !string.IsNullOrWhiteSpace(v)));
    }

    // Inclusive of both months, like LinkedIn: "Jul 2023 - Jan 2025" is "1 yr 7 mos".
    internal static string ExperienceRange(string? start, string? end)
    {
        var range = DateRange(start, end);
        var from = MonthIndex(start);
        // A role with no end date, or one that says "Present", is still going, so it runs to this month.
        var open = string.IsNullOrWhiteSpace(end) || end.Trim().Equals("Present", StringComparison.OrdinalIgnoreCase);
        var to = open ? DateTime.Today.Year * 12 + DateTime.Today.Month - 1 : MonthIndex(end);
        if (from is null || to is null) return range;

        var months = Math.Max(1, to.Value - from.Value + 1);
        var parts = new List<string>();
        if (months / 12 > 0) parts.Add($"{months / 12} {(months / 12 == 1 ? "yr" : "yrs")}");
        if (months % 12 > 0) parts.Add($"{months % 12} {(months % 12 == 1 ? "mo" : "mos")}");
        return $"{range} · {string.Join(' ', parts)}";
    }

    private static int? MonthIndex(string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) return null;
        var year = System.Text.RegularExpressions.Regex.Match(value, @"\b(\d{4})\b");
        if (!year.Success) return null;
        var month = Array.IndexOf(["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"],
            value.Trim().ToLowerInvariant()[..Math.Min(3, value.Trim().Length)]);
        return int.Parse(year.Groups[1].Value) * 12 + Math.Max(month, 0);
    }
}
