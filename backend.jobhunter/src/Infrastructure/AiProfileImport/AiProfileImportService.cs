using backend.jobhunter.Application.Common.Interfaces;
using backend.jobhunter.Infrastructure.AiCommon;

namespace backend.jobhunter.Infrastructure.AiProfileImport;

public class AiProfileImportService(AiJsonClient ai) : IProfileImportAiService
{
    private const int MaxTokens = 8192;

    public Task<ParsedProfileDto> ParseAsync(string cvText, CancellationToken cancellationToken)
        => ai.CompleteAsync<ParsedProfileDto>(
            ProfileImportPrompt.BuildPrompt(cvText), ProfileImportPrompt.ProfileSchemaJson, "profile", MaxTokens,
            ai.Options.AnthropicCvModel, ai.Options.OpenAiCvModel, cancellationToken);
}
