using backend.jobhunter.Application.CandidateProfiles.Queries.GetProfileImportJob;
using backend.jobhunter.Application.Common.Exceptions;
using backend.jobhunter.Application.Common.Interfaces;
using backend.jobhunter.Domain.Entities;
using backend.jobhunter.Domain.Enums;

namespace backend.jobhunter.Application.CandidateProfiles;

// A CV the system could not read, with a message written for the user.
public class ProfileImportFailedException(string message) : Exception(message);

// Reads the CV of a Pending job with the AI. Run by the background worker, never inside a web request,
// because a long CV can take longer than the reverse proxy waits.
public class ProfileImportService(
    IApplicationDbContext context, IFileStorage fileStorage, ICvTextExtractor textExtractor, IProfileImportAiService aiService)
{
    public const string UnreadableMessage = "Could not read this CV. Use a text-based PDF or DOCX and try again.";

    public async Task RunAsync(int jobId, CancellationToken cancellationToken)
    {
        var job = await context.ProfileImportJobs.FirstOrDefaultAsync(j => j.Id == jobId, cancellationToken)
            ?? throw new NotFoundException(nameof(ProfileImportJob), jobId);
        var cv = await context.Cvs.AsNoTracking().FirstOrDefaultAsync(c => c.Id == job.CvId, cancellationToken)
            ?? throw new NotFoundException(nameof(Cv), job.CvId);

        string text;
        try
        {
            await using var stream = await fileStorage.OpenReadAsync(cv.StorageKey, cancellationToken);
            text = await textExtractor.ExtractTextAsync(stream, cv.FileName, cancellationToken);
        }
        catch (InvalidOperationException ex)
        {
            // The extractor words these for the user ("No readable text was found...", "Only PDF and DOCX..."),
            // and it throws before any AI call is paid for.
            throw new ProfileImportFailedException(ex.Message);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            throw new ProfileImportFailedException(UnreadableMessage);
        }

        var parsed = ClampToLimits(await aiService.ParseAsync(text, cancellationToken));

        job.ResultJson = ProfileImportJobMapping.Serialize(parsed);
        job.Error = null;
        job.Status = ProfileImportStatus.Completed;
        await context.SaveChangesAsync(cancellationToken);
    }

    // The AI sometimes ignores the length limits in the prompt, and the confirm step then fails validation
    // (for example an experience description of 2,500 characters). Trim the long free-text fields to the
    // limits the import validator enforces so the user can always confirm what was read.
    public static ParsedProfileDto ClampToLimits(ParsedProfileDto p) => p with
    {
        Headline = Clamp(p.Headline, 220),
        Summary = Clamp(p.Summary, 2600),
        Experiences = [.. p.Experiences.Select(e => e with { Description = Clamp(e.Description, 2000) })],
        Educations = [.. p.Educations.Select(e => e with { Details = Clamp(e.Details, 2000) })],
        Projects = [.. p.Projects.Select(e => e with { Description = Clamp(e.Description, 2000) })],
    };

    // Cuts at the last line break before the limit when there is one, so bullet lists stay whole.
    private static string? Clamp(string? value, int max)
    {
        if (value is null || value.Length <= max) return value;

        var cut = value.LastIndexOf('\n', max - 1);
        return (cut > max / 2 ? value[..cut] : value[..max]).TrimEnd();
    }
}
