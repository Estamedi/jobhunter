using backend.jobhunter.Application.Common.Interfaces;
using backend.jobhunter.Infrastructure.AiCommon;

namespace backend.jobhunter.Infrastructure.AiCvGeneration;

// Generates a structured CV with whichever AI provider is configured (see AiJsonClient).
public class AiCvGenerationService(AiJsonClient ai) : ICvGenerationAiService
{
    private const int MaxTokens = 8192;

    public Task<GeneratedCvDto> GenerateAsync(CvGenerationRequest request, CancellationToken cancellationToken)
        => RunAsync(CvGenerationPrompt.BuildPrompt(request), cancellationToken);

    public Task<GeneratedCvDto> RefineSectionAsync(CvSectionRefineRequest request, CancellationToken cancellationToken)
        => RunAsync(CvGenerationPrompt.BuildRefinePrompt(request), cancellationToken);

    private Task<GeneratedCvDto> RunAsync(string prompt, CancellationToken cancellationToken)
        => ai.CompleteAsync<GeneratedCvDto>(
            prompt, CvGenerationPrompt.CvSchemaJson, "cv", MaxTokens,
            ai.Options.AnthropicCvModel, ai.Options.OpenAiCvModel, cancellationToken);
}
