using backend.jobhunter.Application.Common.Interfaces;
using backend.jobhunter.Application.CandidateProfiles;
using DocumentFormat.OpenXml;
using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Wordprocessing;
using A = DocumentFormat.OpenXml.Drawing;
using PIC = DocumentFormat.OpenXml.Drawing.Pictures;
using WP = DocumentFormat.OpenXml.Drawing.Wordprocessing;

namespace backend.jobhunter.Infrastructure.CvRendering;

// Word version of the classic CV: A4, single column, Calibri 10.5pt, 0.75in margins, no tables or
// graphics (ATS friendly). Same sections, order and palette as ClassicCvDocument.
public class DocxCvRenderer : ICvDocxRenderer
{
    private const string FontName = "Calibri";
    private const int PageWidth = 11906;   // A4 in twips
    private const int PageHeight = 16838;
    private const int Margin = 1080;       // 0.75in
    private const int ContentWidth = PageWidth - 2 * Margin;
    private const int BulletIndent = 360;

    // The palette follows the template; the layout and density stay classic. An unknown id means classic.
    public byte[] Render(CvHeaderDto header, GeneratedCvDto cv, string? templateId = null)
    {
        var style = CvStyles.For(templateId);
        using var memory = new MemoryStream();
        using (var document = WordprocessingDocument.Create(memory, WordprocessingDocumentType.Document))
        {
            var main = document.AddMainDocumentPart();
            main.Document = new Document();
            var body = main.Document.AppendChild(new Body());

            AddStyles(main, style);
            new Builder(main, body, style).Build(header, cv);

            body.AppendChild(new SectionProperties(
                new PageSize { Width = PageWidth, Height = PageHeight },
                new PageMargin
                {
                    Top = Margin, Right = Margin, Bottom = Margin, Left = Margin,
                    Header = 708, Footer = 708, Gutter = 0,
                }));

            document.PackageProperties.Title = $"{header.FullName} - CV";
            document.PackageProperties.Creator = header.FullName;
            document.PackageProperties.Subject = cv.Headline.Replace("**", string.Empty).Trim();
            document.PackageProperties.Keywords = ClassicCvDocument.Keywords(cv);
            main.Document.Save();
        }

        return memory.ToArray();
    }

    private static void AddStyles(MainDocumentPart main, CvStyle style)
    {
        var bodySize = HalfPoints(style.BodySize);
        var styles = main.AddNewPart<StyleDefinitionsPart>();
        styles.Styles = new Styles(new DocDefaults(
            new RunPropertiesDefault(new RunPropertiesBaseStyle(
                new RunFonts { Ascii = FontName, HighAnsi = FontName, EastAsia = FontName, ComplexScript = FontName },
                new Color { Val = style.BodyColor.TrimStart('#') },
                new FontSize { Val = bodySize },
                new FontSizeComplexScript { Val = bodySize })),
            // About 13pt line spacing, growing for the larger name and headings.
            new ParagraphPropertiesDefault(new ParagraphPropertiesBaseStyle(
                new SpacingBetweenLines { After = "0", Line = "260", LineRule = LineSpacingRuleValues.AtLeast }))));
        styles.Styles.Save();
    }

    private static string HalfPoints(float points) => ((int)Math.Round(points * 2)).ToString();

    private sealed class Builder(MainDocumentPart main, Body body, CvStyle style)
    {
        public void Build(CvHeaderDto header, GeneratedCvDto cv)
        {
            Header(header, cv);

            if (!string.IsNullOrWhiteSpace(cv.Summary))
            {
                Section("Summary");
                var p = Paragraph();
                AppendRich(p, cv.Summary);
            }

            if (cv.Skills.Count > 0)
            {
                Section("Technical Skills");
                foreach (var group in cv.Skills)
                {
                    var p = BulletParagraph(justify: false);
                    if (!string.IsNullOrWhiteSpace(group.Category)) p.Append(Run($"{group.Category}: ", bold: true));
                    p.Append(Run(string.Join(", ", group.Items).Replace("**", "")));
                }
            }

            if (cv.Experience.Count > 0)
            {
                Section("Professional Experience");
                foreach (var job in cv.Experience) Experience(job);
            }

            if (cv.Projects.Count > 0)
            {
                Section("Projects");
                foreach (var project in cv.Projects)
                {
                    var p = Paragraph();
                    p.Append(Run(project.Name, bold: true));
                    if (!string.IsNullOrWhiteSpace(project.Description)) AppendRich(p, $" - {project.Description}");
                    if (!string.IsNullOrWhiteSpace(project.Url))
                    {
                        p.Append(Run(" "));
                        p.Append(Link(project.Url, project.Url));
                    }
                }
            }

            if (cv.Education.Count > 0)
            {
                Section("Education");
                foreach (var edu in cv.Education)
                {
                    Paragraph().Append(Run(edu.Institution));
                    var p = Paragraph();
                    var line = edu.Degree;
                    var dates = ClassicCvDocument.DateRange(edu.StartDate, edu.EndDate);
                    if (dates.Length > 0) line += $", {dates}";
                    if (!string.IsNullOrWhiteSpace(edu.Details)) line += $" ({edu.Details})";
                    p.Append(Run(line));
                }
            }

            if (cv.Certifications.Count > 0)
            {
                Section("Certifications");
                foreach (var cert in cv.Certifications) BulletParagraph(justify: false).Append(Run(cert));
            }

            var otherLinks = ClassicCvDocument.OtherLinks(cv);
            if (otherLinks.Count > 0 || cv.Languages.Count > 0)
            {
                Section("Additional Information");
                foreach (var link in otherLinks) Paragraph().Append(Link(ClassicCvDocument.LinkUrl(link), link));
                if (cv.Languages.Count > 0)
                {
                    var p = Paragraph();
                    p.Append(Run("Languages: ", bold: true));
                    p.Append(Run(string.Join(", ", cv.Languages)));
                }
            }
        }

        // Photo on the left and a QR code on the right, both as floating pictures that the text wraps around,
        // so the name and contact lines stay in ordinary paragraphs an ATS can read. A missing photo or link
        // leaves its picture out.
        private void PhotoHeader(CvHeaderDto header, GeneratedCvDto cv)
        {
            const float photoWidth = 90, photoHeight = 120, qrSize = 82;
            var photo = CvImages.UsablePhoto(header.Photo);
            var link = ClassicCvDocument.HeaderLink(cv);

            var name = Paragraph();
            if (photo is not null)
            {
                var type = CandidatePhotoRules.ContentTypeOf(photo) == "image/png" ? ImagePartType.Png : ImagePartType.Jpeg;
                name.Append(new Run(AnchoredImage(photo, type, photoWidth, photoHeight, right: false, id: 1, name: "Photo")));
            }
            if (ClassicCvDocument.IsLinkedIn(link))
            {
                name.Append(new Run(AnchoredImage(CvImages.QrCodePng(ClassicCvDocument.LinkUrl(link!)), ImagePartType.Png, qrSize, qrSize, right: true, id: 2, name: "QR code")));
            }
            name.Append(Run(header.FullName, size: 17, color: style.NameColor));

            if (!string.IsNullOrWhiteSpace(cv.Headline))
            {
                Paragraph().Append(Run(cv.Headline.Replace("**", string.Empty), bold: true, size: 17, color: style.BodyColor));
            }

            void Line(string label, string? value, bool mailto = false)
            {
                if (string.IsNullOrWhiteSpace(value)) return;
                var p = Paragraph();
                p.Append(Run($"{label}: ", color: style.MutedColor));
                p.Append(mailto
                    ? Link($"mailto:{value.Trim()}", value.Trim(), bold: true, color: style.MutedColor, underline: false)
                    : Run(value.Trim(), bold: true, color: style.MutedColor));
            }

            Line("Residence", header.Location);
            Line("Phone", header.Phone);
            Line("Email", header.Email, mailto: true);
            Line("Availability", header.Availability);
            if (link is not null)
            {
                var p = Paragraph();
                p.Append(Run(link.Contains("linkedin.com", StringComparison.OrdinalIgnoreCase) ? "LinkedIn: " : "Link: ", color: style.MutedColor));
                p.Append(Link(ClassicCvDocument.LinkUrl(link), ClassicCvDocument.LinkText(link), bold: true, color: style.MutedColor, underline: false));
            }

            // Ends the text wrapping, so the Summary heading starts below the photo and not beside it.
            if (photo is not null || link is not null)
            {
                Paragraph().Append(new Run(new Break { Type = BreakValues.TextWrapping, Clear = BreakTextRestartLocationValues.All }));
            }
        }

        private Drawing AnchoredImage(byte[] bytes, PartTypeInfo type, float widthPt, float heightPt, bool right, int id, string name)
        {
            var part = main.AddImagePart(type);
            using (var stream = new MemoryStream(bytes)) part.FeedData(stream);
            var relationshipId = main.GetIdOfPart(part);

            long cx = (long)(widthPt * 12700), cy = (long)(heightPt * 12700);

            return new Drawing(
                new WP.Anchor(
                    new WP.SimplePosition { X = 0, Y = 0 },
                    new WP.HorizontalPosition(new WP.HorizontalAlignment(right ? "right" : "left")) { RelativeFrom = WP.HorizontalRelativePositionValues.Margin },
                    new WP.VerticalPosition(new WP.PositionOffset("0")) { RelativeFrom = WP.VerticalRelativePositionValues.Paragraph },
                    new WP.Extent { Cx = cx, Cy = cy },
                    new WP.EffectExtent { LeftEdge = 0, TopEdge = 0, RightEdge = 0, BottomEdge = 0 },
                    new WP.WrapSquare { WrapText = WP.WrapTextValues.BothSides },
                    new WP.DocProperties { Id = (uint)id, Name = name, Description = name },
                    new WP.NonVisualGraphicFrameDrawingProperties(new A.GraphicFrameLocks { NoChangeAspect = true }),
                    new A.Graphic(
                        new A.GraphicData(
                            new PIC.Picture(
                                new PIC.NonVisualPictureProperties(
                                    new PIC.NonVisualDrawingProperties { Id = 0, Name = name },
                                    new PIC.NonVisualPictureDrawingProperties()),
                                new PIC.BlipFill(new A.Blip { Embed = relationshipId }, new A.Stretch(new A.FillRectangle())),
                                new PIC.ShapeProperties(
                                    new A.Transform2D(new A.Offset { X = 0, Y = 0 }, new A.Extents { Cx = cx, Cy = cy }),
                                    new A.PresetGeometry(new A.AdjustValueList()) { Preset = A.ShapeTypeValues.Rectangle })))
                        { Uri = "http://schemas.openxmlformats.org/drawingml/2006/picture" }))
                {
                    DistanceFromTop = 0U, DistanceFromBottom = 0U, DistanceFromLeft = 114300U, DistanceFromRight = 114300U,
                    SimplePos = false, RelativeHeight = 251658240U, BehindDoc = false, Locked = false, LayoutInCell = true, AllowOverlap = true,
                });
        }

        private void Header(CvHeaderDto header, GeneratedCvDto cv)
        {
            if (style.PhotoHeader)
            {
                PhotoHeader(header, cv);
                return;
            }

            var name = Paragraph(center: true);
            name.Append(Run(header.FullName, size: 16, color: style.NameColor));

            if (!string.IsNullOrWhiteSpace(cv.Headline))
            {
                var headline = Paragraph(center: true);
                headline.Append(Run(cv.Headline, bold: true, size: 11.5f, color: style.NameColor));
            }

            var contact = new[] { ("Location", header.Location), ("Phone", header.Phone), ("Email", header.Email) }
                .Where(c => !string.IsNullOrWhiteSpace(c.Item2))
                .ToList();
            var headerLink = ClassicCvDocument.HeaderLink(cv);
            if (contact.Count == 0 && headerLink is null) return;

            var line = Paragraph(center: true, before: 40);
            for (var i = 0; i < contact.Count; i++)
            {
                if (i > 0) line.Append(Run(" |  ", color: style.MutedColor));
                var value = contact[i].Item2!.Trim();
                // Email is a real mailto link so ATS parsers and recruiters can click it.
                line.Append(contact[i].Item1 == "Email"
                    ? Link($"mailto:{value}", value, bold: true, color: style.MutedColor, underline: false)
                    : Run(value, bold: true, color: style.MutedColor));
            }

            if (headerLink is not null)
            {
                if (contact.Count > 0) line.Append(Run(" |  ", color: style.MutedColor));
                line.Append(Link(ClassicCvDocument.LinkUrl(headerLink), ClassicCvDocument.LinkText(headerLink),
                    bold: true, color: style.MutedColor, underline: false));
            }
        }

        private void Section(string title)
        {
            var p = Paragraph(before: 120, after: 20, keepNext: true);
            p.Append(Run(title, bold: true, size: 11.5f, color: style.HeadingColor));
        }

        private void Experience(CvExperienceDto job)
        {
            var title = Paragraph(before: 80, keepNext: true, rightTab: true);
            title.Append(Run(string.IsNullOrWhiteSpace(job.Location) ? job.Company : $"{job.Company}, {job.Location}",
                bold: true, color: style.CompanyColor));
            if (!string.IsNullOrWhiteSpace(job.Role))
                title.Append(Run($", {job.Role}", italic: true, color: style.MutedColor));

            var dates = ClassicCvDocument.ExperienceRange(job.StartDate, job.EndDate);
            if (dates.Length > 0)
            {
                title.Append(new Run(new TabChar()));
                title.Append(Run(dates, size: 9, color: style.MutedColor));
            }

            foreach (var bullet in job.Bullets)
            {
                var p = BulletParagraph(justify: false);
                AppendRich(p, bullet);
            }
        }

        private Paragraph Paragraph(bool center = false, bool justify = false, int before = 0, int after = 0,
            bool keepNext = false, bool rightTab = false)
        {
            var props = new ParagraphProperties();
            if (keepNext) props.Append(new KeepNext());
            if (rightTab) props.Append(new Tabs(new TabStop { Val = TabStopValues.Right, Position = ContentWidth }));
            if (before > 0 || after > 0)
                props.Append(new SpacingBetweenLines { Before = before.ToString(), After = after.ToString(), Line = "260", LineRule = LineSpacingRuleValues.AtLeast });
            if (center) props.Append(new Justification { Val = JustificationValues.Center });
            else if (justify) props.Append(new Justification { Val = JustificationValues.Both });
            return body.AppendChild(new Paragraph(props));
        }

        // Bullet as a text "•" plus a hanging indent: no numbering part needed and it stays plain text for ATS.
        private Paragraph BulletParagraph(bool justify)
        {
            var props = new ParagraphProperties(
                new Tabs(new TabStop { Val = TabStopValues.Left, Position = BulletIndent }),
                new Indentation { Left = BulletIndent.ToString(), Hanging = BulletIndent.ToString() });
            if (justify) props.Append(new Justification { Val = JustificationValues.Both });

            var p = body.AppendChild(new Paragraph(props));
            p.Append(Run("•"));
            p.Append(new Run(new TabChar()));
            return p;
        }

        // **double asterisks** mark bold segments, same convention as the PDF renderer.
        private static void AppendRich(Paragraph p, string? value)
        {
            if (string.IsNullOrEmpty(value)) return;
            var parts = value.Split("**");
            for (var i = 0; i < parts.Length; i++)
            {
                if (parts[i].Length == 0) continue;
                p.Append(Run(parts[i], bold: i % 2 == 1));
            }
        }

        private OpenXmlElement Link(string target, string text, bool bold = false, string? color = null, bool underline = true)
        {
            var normalized = target.StartsWith("mailto:", StringComparison.OrdinalIgnoreCase)
                || target.StartsWith("http", StringComparison.OrdinalIgnoreCase)
                ? target
                : $"https://{target}";

            if (!Uri.TryCreate(normalized, UriKind.Absolute, out var uri)
                || uri.Scheme is not ("http" or "https" or "mailto"))
            {
                return Run(text, bold: bold, color: color);
            }

            var relationship = main.AddHyperlinkRelationship(uri, true);
            return new Hyperlink(Run(text, bold: bold, color: color ?? style.CompanyColor, underline: underline))
            {
                Id = relationship.Id,
            };
        }

        private static Run Run(string text, bool bold = false, bool italic = false, string? color = null,
            float? size = null, bool underline = false)
        {
            var props = new RunProperties();
            if (bold) props.Append(new Bold());
            if (italic) props.Append(new Italic());
            if (color is not null) props.Append(new Color { Val = color.TrimStart('#') });
            if (size is not null)
            {
                props.Append(new FontSize { Val = HalfPoints(size.Value) });
                props.Append(new FontSizeComplexScript { Val = HalfPoints(size.Value) });
            }
            if (underline) props.Append(new Underline { Val = UnderlineValues.Single });

            return new Run(props, new Text(text) { Space = SpaceProcessingModeValues.Preserve });
        }
    }
}
