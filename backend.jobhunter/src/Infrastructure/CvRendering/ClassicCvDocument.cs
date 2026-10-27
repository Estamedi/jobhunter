using backend.jobhunter.Application.Common.Interfaces;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace backend.jobhunter.Infrastructure.CvRendering;

// Single-column CV: centred header, blue section headings, bulleted skills and experience with
// dates right-aligned. Layout and palette follow the owner's reference CV (A4, Lato).
public class ClassicCvDocument(CvHeaderDto header, GeneratedCvDto cv) : IDocument
{
    private const string HeadingColor = "#4285F4";
    private const string CompanyColor = "#1155CC";
    private const string NameColor = "#353744";
    private const string MutedColor = "#666666";
    private const string BodyColor = "#202124";
    private const float BodySize = 10f;

    public DocumentMetadata GetMetadata() => new() { Title = $"{header.FullName} - CV" };

    public void Compose(IDocumentContainer container)
    {
        container.Page(page =>
        {
            page.Size(PageSizes.A4);
            page.Margin(0.6f, Unit.Inch);
            page.DefaultTextStyle(t => t.FontFamily("Lato").FontSize(BodySize).FontColor(BodyColor).LineHeight(1.25f));

            page.Content().Column(col =>
            {
                col.Spacing(6);
                col.Item().Element(Header);

                if (!string.IsNullOrWhiteSpace(cv.Summary))
                {
                    col.Item().Element(c => Section(c, "Summary", s =>
                        s.Item().Text(t => { t.Justify(); t.AppendRich(cv.Summary); })));
                }

                if (cv.Skills.Count > 0)
                {
                    col.Item().Element(c => Section(c, "Skills", s =>
                    {
                        foreach (var group in cv.Skills)
                        {
                            s.Item().Element(b => Bullet(b, t =>
                            {
                                if (!string.IsNullOrWhiteSpace(group.Category)) t.Span($"{group.Category}: ").Bold();
                                t.Span(string.Join(", ", group.Items));
                            }));
                        }
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
                                if (!string.IsNullOrWhiteSpace(project.Url)) t.Hyperlink($" {project.Url}", project.Url).FontColor(CompanyColor).Underline();
                            });
                        }
                    }));
                }

                if (cv.Experience.Count > 0)
                {
                    col.Item().Element(c => Section(c, "Experience", s =>
                    {
                        s.Spacing(8);
                        foreach (var job in cv.Experience) s.Item().Element(e => Experience(e, job));
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

                if (cv.Links.Count > 0 || cv.Languages.Count > 0)
                {
                    col.Item().Element(c => Section(c, "Additional Information", s =>
                    {
                        foreach (var link in cv.Links)
                        {
                            s.Item().Text(t => t.Hyperlink(link, link.StartsWith("http", StringComparison.OrdinalIgnoreCase) ? link : $"https://{link}")
                                .FontColor(CompanyColor).Underline());
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

    private void Header(IContainer container)
    {
        container.AlignCenter().Column(col =>
        {
            col.Item().AlignCenter().Text(header.FullName).FontSize(16).FontColor(NameColor);
            if (!string.IsNullOrWhiteSpace(cv.Headline))
            {
                col.Item().AlignCenter().Text(cv.Headline).FontSize(14).Bold().FontColor(NameColor);
            }

            // "Location: Muscat, Oman | Phone: (+968) ... | Email: ..." with bold values.
            var contact = new[] { ("Location", header.Location), ("Phone", header.Phone), ("Email", header.Email) }
                .Where(c => !string.IsNullOrWhiteSpace(c.Item2))
                .ToList();
            if (contact.Count > 0)
            {
                col.Item().PaddingTop(2).AlignCenter().Text(t =>
                {
                    t.DefaultTextStyle(x => x.FontSize(10).FontColor(MutedColor));
                    for (var i = 0; i < contact.Count; i++)
                    {
                        if (i > 0) t.Span(" |  ");
                        t.Span($"{contact[i].Item1}: ");
                        t.Span(contact[i].Item2!.Trim()).Bold();
                    }
                });
            }
        });
    }

    private static void Section(IContainer container, string title, Action<ColumnDescriptor> body)
    {
        container.Column(col =>
        {
            col.Spacing(2);
            col.Item().PaddingTop(2).Text(title).FontSize(11).Bold().FontColor(HeadingColor);
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

    private static void Experience(IContainer container, CvExperienceDto job)
    {
        container.Column(col =>
        {
            col.Item().Row(row =>
            {
                row.RelativeItem().Text(t =>
                {
                    t.Span(string.IsNullOrWhiteSpace(job.Location) ? job.Company : $"{job.Company}, {job.Location}")
                        .Bold().FontColor(CompanyColor);
                    if (!string.IsNullOrWhiteSpace(job.Role)) t.Span($", {job.Role}").Italic().FontColor(MutedColor);
                });
                var dates = DateRange(job.StartDate, job.EndDate);
                if (dates.Length > 0) row.AutoItem().Text(dates).FontColor(MutedColor).FontSize(9);
            });

            foreach (var bullet in job.Bullets)
            {
                col.Item().Element(b => Bullet(b, t => { t.Justify(); t.AppendRich(bullet); }));
            }
        });
    }

    private static string DateRange(string? start, string? end)
    {
        var from = start?.Trim();
        var to = string.IsNullOrWhiteSpace(end) ? (string.IsNullOrWhiteSpace(from) ? null : "Present") : end.Trim();
        return string.Join(" - ", new[] { from, to }.Where(v => !string.IsNullOrWhiteSpace(v)));
    }
}
