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

        var parsed = await aiService.ParseAsync(text, cancellationToken);

        job.ResultJson = ProfileImportJobMapping.Serialize(parsed);
        job.Error = null;
        job.Status = ProfileImportStatus.Completed;
        await context.SaveChangesAsync(cancellationToken);
    }
}
