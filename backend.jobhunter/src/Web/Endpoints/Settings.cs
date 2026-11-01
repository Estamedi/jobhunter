using Microsoft.AspNetCore.Http.HttpResults;
using backend.jobhunter.Application.Settings.Commands.UpdateAiProvider;
using backend.jobhunter.Application.Settings.Queries.GetAiSettings;

namespace backend.jobhunter.Web.Endpoints;

public class Settings : IEndpointGroup
{
    public static void Map(RouteGroupBuilder groupBuilder)
    {
        groupBuilder.RequireAuthorization();
        groupBuilder.MapGet(GetAiSettings, "ai");
        groupBuilder.MapPut(UpdateAiProvider, "ai");
    }

    [EndpointSummary("Get AI settings")]
    [EndpointDescription("Administrator only. Returns the active AI provider and which providers have an API key configured.")]
    public static async Task<Ok<AiSettingsDto>> GetAiSettings(ISender sender, CancellationToken cancellationToken)
        => TypedResults.Ok(await sender.Send(new GetAiSettingsQuery(), cancellationToken));

    [EndpointSummary("Choose the AI provider")]
    [EndpointDescription("Administrator only. Sets which provider (OpenRouter, Anthropic or OpenAI) handles AI requests.")]
    public static async Task<NoContent> UpdateAiProvider(
        UpdateAiProviderCommand command, ISender sender, CancellationToken cancellationToken)
    {
        await sender.Send(command, cancellationToken);
        return TypedResults.NoContent();
    }
}
