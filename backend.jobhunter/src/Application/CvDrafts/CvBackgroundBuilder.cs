using System.Text;
using backend.jobhunter.Application.Common.Interfaces;
using backend.jobhunter.Domain.Entities;

namespace backend.jobhunter.Application.CvDrafts;

// Turns the candidate's saved profile (plus any extra notes typed in the CV Writer) into the
// "source of truth" text the AI writes the CV from.
public static class CvBackgroundBuilder
{
    public static async Task<string?> BuildAsync(
        IApplicationDbContext context, int candidateId, string? extraNotes, CancellationToken cancellationToken)
    {
        var profile = await context.CandidateProfiles.AsNoTracking()
            .Include(p => p.Experiences)
            .FirstOrDefaultAsync(p => p.CandidateId == candidateId, cancellationToken);

        return Build(profile, extraNotes);
    }

    public static string? Build(CandidateProfile? profile, string? extraNotes)
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
                foreach (var e in experiences)
                {
                    var end = e.IsCurrent || e.EndDate is null ? "Present" : e.EndDate.Value.ToString("MMM yyyy");
                    var place = string.Join(", ", new[] { e.Location, e.WorkplaceType?.ToString() }
                        .Where(v => !string.IsNullOrWhiteSpace(v)));
                    var type = e.EmploymentType?.ToString();

                    sb.AppendLine($"- {e.Title} at {e.Company}" +
                                  (type is null ? "" : $" ({type})") +
                                  (place.Length == 0 ? "" : $", {place}") +
                                  $" | {e.StartDate:MMM yyyy} - {end}");
                    if (!string.IsNullOrWhiteSpace(e.Description)) sb.AppendLine(Indent(e.Description));
                    if (e.Skills.Count > 0) sb.AppendLine($"  Skills: {string.Join(", ", e.Skills)}");
                }
            }
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
