using backend.jobhunter.Application.Common.Interfaces;
using backend.jobhunter.Infrastructure.CvRendering;
using NUnit.Framework;
using Shouldly;
using UglyToad.PdfPig;

namespace backend.jobhunter.Application.UnitTests.Infrastructure;

// A long CV has to break between pages without leaving a heading, or a role line, alone at the bottom.
public class CvPageBreakTests
{
    private static readonly string[] Headings =
        ["Summary", "Technical Skills", "Professional Experience", "Projects", "Education", "Certifications", "Additional Information"];

    private static GeneratedCvDto LongCv(int roles, int bulletsPerRole, int wordsPerBullet, int variant)
    {
        string Bullet(int r, int b) => string.Join(' ', Enumerable.Range(0, wordsPerBullet + (b + r + variant) % 5).Select(w => $"detail{r}x{b}x{w}"));

        return new GeneratedCvDto
        {
            Headline = "Senior Engineer",
            Summary = string.Join(' ', Enumerable.Range(0, 60 + variant * 7).Select(w => $"summary{w}")),
            Skills = [new CvSkillGroupDto { Category = "Backend", Items = Enumerable.Range(0, 12 + variant).Select(i => $"Skill{i}").ToList() }],
            Experience = Enumerable.Range(0, roles).Select(r => new CvExperienceDto
            {
                Role = $"Role{r}", Company = $"Company{r}", StartDate = "Jan 2015", EndDate = "Dec 2016",
                Bullets = Enumerable.Range(0, bulletsPerRole).Select(b => Bullet(r, b)).ToList(),
            }).ToList(),
            Education = [new CvEducationDto { Degree = "BSc", Institution = "Uni", StartDate = "2005", EndDate = "2009" }],
            Certifications = ["AZ-204"],
            Languages = ["English"],
        };
    }

    // The last line of every page except the final one.
    private static List<string> LastLines(byte[] pdf)
    {
        using var document = PdfDocument.Open(pdf);
        var pages = document.GetPages().ToList();
        var lines = new List<string>();
        foreach (var page in pages.Take(pages.Count - 1))
        {
            var words = page.GetWords().ToList();
            if (words.Count == 0) continue;
            var bottom = words.Min(w => w.BoundingBox.Bottom);
            lines.Add(string.Join(' ', words.Where(w => Math.Abs(w.BoundingBox.Bottom - bottom) < 3).OrderBy(w => w.BoundingBox.Left).Select(w => w.Text)));
        }
        return lines;
    }

    private static bool IsHeading(string line) => Headings.Any(h => string.Equals(line.Trim(), h, StringComparison.Ordinal));

    // A role line is "CompanyN, RoleN" with its dates; a bullet line starts with the bullet mark.
    private static bool IsRoleLine(string line) => line.Contains("Company") && line.Contains("Role") && !line.Contains("detail");

    [TestCaseSource(typeof(CvTemplates), nameof(CvTemplates.All))]
    public void ShouldNeverEndAPageOnAHeadingOrALoneRoleLine(string templateId)
    {
        var pagesChecked = 0;
        for (var variant = 0; variant < 24; variant++)
        {
            var cv = LongCv(roles: 6 + variant % 5, bulletsPerRole: 3 + variant % 3, wordsPerBullet: 14 + variant, variant);
            var pdf = new QuestPdfCvRenderer().Render(templateId, new CvHeaderDto("Jane Sample", "jane@example.com", "123", "Muscat"), cv);

            foreach (var line in LastLines(pdf))
            {
                pagesChecked++;
                IsHeading(line).ShouldBeFalse($"{templateId} variant {variant}: a page ends on the heading \"{line}\"");
                IsRoleLine(line).ShouldBeFalse($"{templateId} variant {variant}: a page ends on the role line \"{line}\"");
            }
        }
        pagesChecked.ShouldBeGreaterThan(24, "the test CVs must run over several pages");
    }
}
