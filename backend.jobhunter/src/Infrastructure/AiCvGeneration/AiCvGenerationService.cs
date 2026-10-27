using backend.jobhunter.Application.Common.Interfaces;
using backend.jobhunter.Infrastructure.AiCommon;

namespace backend.jobhunter.Infrastructure.AiCvGeneration;

// Generates a structured CV with whichever AI provider is configured (see AiJsonClient).
public class AiCvGenerationService(AiJsonClient ai) : ICvGenerationAiService
{
    private const int MaxTokens = 8192;

    public Task<GeneratedCvDto> GenerateAsync(CvGenerationRequest request, CancellationToken cancellationToken)
        => RunAsync(CvGenerationPrompt.SystemPrompt, CvGenerationPrompt.BuildUserPrompt(request), cancellationToken);

    public Task<GeneratedCvDto> RefineSectionAsync(CvSectionRefineRequest request, CancellationToken cancellationToken)
        => RunAsync(CvGenerationPrompt.RefineSystemPrompt, CvGenerationPrompt.BuildRefineUserPrompt(request), cancellationToken);

    // No model overrides: this small extraction runs on the cheaper default model, not the CV model.
    public Task<JobRequirementsDto> ExtractRequirementsAsync(string jobDescription, CancellationToken cancellationToken)
        => ai.CompleteAsync<JobRequirementsDto>(
            JobRequirementsPrompt.SystemPrompt, JobRequirementsPrompt.BuildUserPrompt(jobDescription),
            JobRequirementsPrompt.SchemaJson, "job_requirements", 2048, null, null, cancellationToken);

    private Task<GeneratedCvDto> RunAsync(string systemPrompt, string prompt, CancellationToken cancellationToken)
        => ai.CompleteAsync<GeneratedCvDto>(
            systemPrompt, prompt, CvGenerationPrompt.CvSchemaJson, "cv", MaxTokens,
            ai.Options.AnthropicCvModel, ai.Options.OpenAiCvModel, cancellationToken);
}
