using Microsoft.AspNetCore.Http.HttpResults;
using backend.jobhunter.Application.Settings.Commands.RemoveAiProviderKey;
using backend.jobhunter.Application.Settings.Commands.SetAiProviderKey;
using backend.jobhunter.Application.Settings.Commands.UpdateAiActions;
using backend.jobhunter.Application.Settings.Commands.UpdateAiProvider;
using backend.jobhunter.Application.Common.Interfaces;
using backend.jobhunter.Application.Settings.Queries.GetAiModels;
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
        groupBuilder.MapGet(GetAiModels, "ai/models/{provider}");
        groupBuilder.MapPut(SetAiProviderKey, "ai/keys/{provider}");
        groupBuilder.MapDelete(RemoveAiProviderKey, "ai/keys/{provider}");
    }

    public record SetAiProviderKeyRequest(string ApiKey);

    [EndpointSummary("List the models of an AI provider")]
    [EndpointDescription("Administrator only. Asks the provider for its models with the key the server uses. Never fails because of the provider: Problem says why the list is empty.")]
    public static async Task<Ok<AiModelList>> GetAiModels(string provider, ISender sender, CancellationToken cancellationToken)
        => TypedResults.Ok(await sender.Send(new GetAiModelsQuery(provider), cancellationToken));

    [EndpointSummary("Save an AI provider API key")]
    [EndpointDescription("Administrator only. Saves the API key for one provider, encrypted. It is used instead of the key in server configuration. The key is never returned.")]
    public static async Task<NoContent> SetAiProviderKey(
        string provider, SetAiProviderKeyRequest request, ISender sender, CancellationToken cancellationToken)
    {
        await sender.Send(new SetAiProviderKeyCommand(provider, request.ApiKey ?? string.Empty), cancellationToken);
        return TypedResults.NoContent();
    }

    [EndpointSummary("Remove a saved AI provider API key")]
    [EndpointDescription("Administrator only. Removes the saved key for one provider, so the key in server configuration is used again.")]
    public static async Task<NoContent> RemoveAiProviderKey(
        string provider, ISender sender, CancellationToken cancellationToken)
    {
        await sender.Send(new RemoveAiProviderKeyCommand(provider), cancellationToken);
        return TypedResults.NoContent();
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
