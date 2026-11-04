using Microsoft.AspNetCore.Http.HttpResults;
using backend.jobhunter.Application.Settings.Commands.UpdateAiActions;
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
        groupBuilder.MapPut(UpdateAiActions, "ai/actions");
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

    [EndpointSummary("Choose the AI provider and model per action")]
    [EndpointDescription("Administrator only. Sets the provider and model for each AI action (job extraction, CV generation, profile import). Empty values use the default provider and model.")]
    public static async Task<NoContent> UpdateAiActions(
        UpdateAiActionsCommand command, ISender sender, CancellationToken cancellationToken)
    {
        await sender.Send(command, cancellationToken);
        return TypedResults.NoContent();
    }
}
