using System.Text;
using backend.jobhunter.Application.Common.Interfaces;
using backend.jobhunter.Domain.Entities;

namespace backend.jobhunter.Application.CvDrafts;

// Turns the candidate's saved profile (plus any extra notes typed in the CV Writer) into the
// "source of truth" text the AI writes the CV from.
// Text is null when there is nothing to write from. Profile is the loaded profile the text was built
// from, so callers can merge hard facts back from it. Warnings describe anything left out.
public record CvBackground(string? Text, CandidateProfile? Profile, IReadOnlyList<string> Warnings);

public static class CvBackgroundBuilder
{
    public static async Task<CvBackground> BuildAsync(
        IApplicationDbContext context, int candidateId, string? extraNotes, string? sourceCvText,
        CancellationToken cancellationToken)
    {
        var profile = await context.CandidateProfiles.AsNoTracking()
            .Include(p => p.Experiences)
            .Include(p => p.Educations)
            .Include(p => p.Skills)
            .Include(p => p.Projects)
            .Include(p => p.Certifications)
            .Include(p => p.Languages)
            .Include(p => p.Links)
            .FirstOrDefaultAsync(p => p.CandidateId == candidateId, cancellationToken);

        return BuildWithWarnings(profile, extraNotes, sourceCvText);
    }

    public static string? Build(CandidateProfile? profile, string? extraNotes)
        => BuildWithWarnings(profile, extraNotes).Text;

    // When the text is over maxLength, the uploaded CV's text shrinks first, then the descriptions of the
    // oldest roles are left out, so recent experience, the candidate's own notes and the other sections survive.
    public static CvBackground BuildWithWarnings(
        CandidateProfile? profile, string? extraNotes, string? sourceCvText = null, int maxLength = CvLimits.MaxFieldLength)
    {
        var warnings = new List<string>();
        var experienceCount = profile?.Experiences.Count ?? 0;

        // The uploaded CV only backs up the profile, so its text is the first thing to shrink.
        var cvText = string.IsNullOrWhiteSpace(sourceCvText) ? null : sourceCvText.Trim();
        var droppedDescriptions = 0;
        var text = Render(profile, extraNotes, droppedDescriptions, cvText);
        if (text is not null && text.Length > maxLength && cvText is not null)
        {
            var overflow = text.Length - maxLength;
            cvText = overflow >= cvText.Length ? null : cvText[..(cvText.Length - overflow)];
            warnings.Add("Your uploaded CV was too long, so only the start of its text was used.");
            text = Render(profile, extraNotes, droppedDescriptions, cvText);
        }

        while (text is not null && text.Length > maxLength && droppedDescriptions < experienceCount)
        {
            droppedDescriptions++;
            text = Render(profile, extraNotes, droppedDescriptions, cvText);
        }

        if (droppedDescriptions > 0)
        {
            warnings.Add($"Your background was too long, so the descriptions of your {droppedDescriptions} oldest role(s) were left out of the CV.");
        }

        if (text is not null && text.Length > maxLength)
        {
            text = text[..maxLength];
            warnings.Add("Your background was still too long, so the end of it was cut off before writing the CV.");
        }

        return new CvBackground(text, profile, warnings);
    }

    private static string? Render(CandidateProfile? profile, string? extraNotes, int droppedDescriptions, string? sourceCvText)
    {
        var sb = new StringBuilder();

        if (profile is not null)
        {
            if (!string.IsNullOrWhiteSpace(profile.Headline)) sb.AppendLine($"Headline: {profile.Headline}");
            if (!string.IsNullOrWhiteSpace(profile.Summary)) sb.AppendLine($"Summary: {profile.Summary}");

            var experiences = profile.Experiences.OrderByDescending(e => e.StartDate).ToList();
            if (experiences.Count > 0)
            {
                sb.AppendLine().AppendLine("Experience:");
                for (var i = 0; i < experiences.Count; i++)
                {
                    var e = experiences[i];
                    var keepDescription = i < experiences.Count - droppedDescriptions;
                    var end = e.IsCurrent || e.EndDate is null ? "Present" : e.EndDate.Value.ToString("MMM yyyy");
                    var place = string.Join(", ", new[] { e.Location, e.WorkplaceType?.ToString() }
                        .Where(v => !string.IsNullOrWhiteSpace(v)));
                    var type = e.EmploymentType?.ToString();

                    sb.AppendLine($"- {e.Title} at {e.Company}" +
                                  (type is null ? "" : $" ({type})") +
                                  (place.Length == 0 ? "" : $", {place}") +
                                  $" | {e.StartDate:MMM yyyy} - {end} [id:{e.Id}]");
                    if (keepDescription && !string.IsNullOrWhiteSpace(e.Description)) sb.AppendLine(Indent(e.Description));
                    if (e.Skills.Count > 0) sb.AppendLine($"  Skills: {string.Join(", ", e.Skills)}");
                }
            }
        }

        if (profile is { Educations.Count: > 0 })
        {
            sb.AppendLine().AppendLine("Education:");
            foreach (var e in profile.Educations.OrderByDescending(e => e.EndDate ?? DateOnly.MaxValue))
            {
                var dates = string.Join(" - ", new[] { e.StartDate?.ToString("yyyy"), e.EndDate?.ToString("yyyy") }
                    .Where(v => v is not null));
                sb.AppendLine($"- {e.Degree}" +
                              (string.IsNullOrWhiteSpace(e.FieldOfStudy) ? "" : $", {e.FieldOfStudy}") +
                              $" at {e.Institution}" +
                              (dates.Length == 0 ? "" : $" | {dates}") +
                              $" [id:{e.Id}]");
                if (!string.IsNullOrWhiteSpace(e.Details)) sb.AppendLine(Indent(e.Details));
            }
        }

        if (profile is { Skills.Count: > 0 })
        {
            sb.AppendLine().AppendLine("Skills:");
            foreach (var group in profile.Skills.OrderBy(s => s.SortOrder).GroupBy(s => s.Category ?? "General"))
            {
                sb.AppendLine($"- {group.Key}: {string.Join(", ", group.Select(s => s.Name))}");
            }
        }

        if (profile is { Projects.Count: > 0 })
        {
            sb.AppendLine().AppendLine("Projects:");
            foreach (var p in profile.Projects.OrderBy(p => p.SortOrder))
            {
                sb.AppendLine($"- {p.Name}" +
                              (string.IsNullOrWhiteSpace(p.Description) ? "" : $": {p.Description.Trim()}") +
                              (string.IsNullOrWhiteSpace(p.Url) ? "" : $" ({p.Url})"));
            }
        }

        if (profile is { Certifications.Count: > 0 })
        {
            sb.AppendLine().AppendLine("Certifications:");
            foreach (var c in profile.Certifications.OrderBy(c => c.SortOrder))
            {
                sb.AppendLine($"- {c.Name}" +
                              (string.IsNullOrWhiteSpace(c.Issuer) ? "" : $", {c.Issuer}") +
                              (c.IssuedDate is null ? "" : $" ({c.IssuedDate:yyyy})"));
            }
        }

        if (profile is { Languages.Count: > 0 })
        {
            sb.AppendLine().AppendLine("Languages:");
            foreach (var l in profile.Languages.OrderBy(l => l.SortOrder))
            {
                sb.AppendLine($"- {l.Name} ({l.Proficiency})");
            }
        }

        if (profile is { Links.Count: > 0 })
        {
            sb.AppendLine().AppendLine("Links:");
            foreach (var l in profile.Links.OrderBy(l => l.SortOrder))
            {
                sb.AppendLine($"- {l.Label}: {l.Url}");
            }
        }

        if (!string.IsNullOrWhiteSpace(sourceCvText))
        {
            if (sb.Length > 0) sb.AppendLine();
            sb.AppendLine("Text of the candidate's uploaded CV (secondary source; the [id:N] entries above take priority):");
            sb.AppendLine(sourceCvText);
        }

        if (!string.IsNullOrWhiteSpace(extraNotes))
        {
            if (sb.Length > 0) sb.AppendLine();
            sb.AppendLine("Additional notes from the candidate:");
            sb.AppendLine(extraNotes.Trim());
        }

        return sb.Length == 0 ? null : sb.ToString().TrimEnd();
    }

    private static string Indent(string text)
        => string.Join('\n', text.Split('\n').Select(line => "  " + line.TrimEnd()));
}
