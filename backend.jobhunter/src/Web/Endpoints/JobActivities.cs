using backend.jobhunter.Application.Activities.Commands.CreateActivity;
using backend.jobhunter.Application.Activities.Commands.DeleteActivity;
using backend.jobhunter.Application.Activities.Commands.UpdateActivity;
using backend.jobhunter.Application.Activities.Queries.GetActivities;
using Microsoft.AspNetCore.Http.HttpResults;

namespace backend.jobhunter.Web.Endpoints;

public class JobActivities : IEndpointGroup
{
    public static string? RoutePrefix => "/api/activities";

    public static void Map(RouteGroupBuilder group)
    {
        group.RequireAuthorization();
        group.MapGet(GetActivities);
        group.MapPost(CreateActivity);
        group.MapPut(UpdateActivity, "{id}");
        group.MapDelete(DeleteActivity, "{id}");
    }

    [EndpointSummary("List activities")]
    public static async Task<Ok<GetActivitiesResult>> GetActivities(
        ISender sender, int? candidateId, int? applicationId, int? companyId, string? type, int page = 1, int pageSize = 50,
        CancellationToken ct = default)
        => TypedResults.Ok(await sender.Send(new GetActivitiesQuery(candidateId, applicationId, companyId, type, page, pageSize), ct));

    [EndpointSummary("Create activity")]
    public static async Task<Created<int>> CreateActivity(ISender sender, CreateActivityCommand command, CancellationToken ct = default)
    {
        var id = await sender.Send(command, ct);
        return TypedResults.Created($"/api/activities/{id}", id);
    }

    [EndpointSummary("Update activity")]
    public static async Task<Results<NoContent, BadRequest>> UpdateActivity(ISender sender, int id, UpdateActivityCommand command, CancellationToken ct = default)
    {
        if (id != command.Id) return TypedResults.BadRequest();
        await sender.Send(command, ct);
        return TypedResults.NoContent();
    }

    [EndpointSummary("Delete activity")]
    public static async Task<NoContent> DeleteActivity(ISender sender, int id, CancellationToken ct = default)
    {
        await sender.Send(new DeleteActivityCommand(id), ct);
        return TypedResults.NoContent();
    }
}
