using backend.jobhunter.Application.Common.Interfaces;
using backend.jobhunter.Domain.Constants;
using backend.jobhunter.Infrastructure.AiCommon;

namespace backend.jobhunter.Infrastructure.AiExtraction;

// Turns raw page content into structured job fields with whichever AI provider and model the administrator
// picked for this action (see AiJsonClient). Keys live only in server config.
public class AiJobExtractionService(AiJsonClient ai) : IJobExtractionAiService
{
    private const int MaxTokens = 4096;

    public Task<ExtractedJobDto> ExtractAsync(JobPageContent page, CancellationToken cancellationToken)
        => ai.CompleteAsync<ExtractedJobDto>(
            JobExtractionPrompt.BuildPrompt(page), JobExtractionPrompt.JobSchemaJson, AiActions.JobPosting, MaxTokens,
            null, null, cancellationToken);
}
