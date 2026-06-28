using backend.jobhunter.Application.Interviews.Commands.CreateInterview;
using backend.jobhunter.Application.Interviews.Commands.DeleteInterview;
using backend.jobhunter.Application.Interviews.Commands.UpdateInterview;
using backend.jobhunter.Application.Interviews.Queries.GetInterviews;
using Microsoft.AspNetCore.Http.HttpResults;

namespace backend.jobhunter.Web.Endpoints;

public class JobInterviews : IEndpointGroup
{
    public static string? RoutePrefix => "/api/interviews";

    public static void Map(RouteGroupBuilder group)
    {
        group.RequireAuthorization();
        group.MapGet(GetInterviews);
        group.MapGet(GetUpcomingInterviews, "upcoming");
        group.MapPost(CreateInterview);
        group.MapPut(UpdateInterview, "{id}");
        group.MapDelete(DeleteInterview, "{id}");
    }

    [EndpointSummary("List interviews")]
    public static async Task<Ok<GetInterviewsResult>> GetInterviews(
        ISender sender, int? candidateId, int? applicationId, int? companyId, string? status, int page = 1, int pageSize = 50,
        CancellationToken ct = default)
        => TypedResults.Ok(await sender.Send(new GetInterviewsQuery(candidateId, applicationId, companyId, status, false, page, pageSize), ct));

    [EndpointSummary("Get upcoming interviews")]
    public static async Task<Ok<GetInterviewsResult>> GetUpcomingInterviews(ISender sender, CancellationToken ct = default)
        => TypedResults.Ok(await sender.Send(new GetInterviewsQuery(UpcomingOnly: true), ct));

    [EndpointSummary("Create interview")]
    public static async Task<Created<int>> CreateInterview(ISender sender, CreateInterviewCommand command, CancellationToken ct = default)
    {
        var id = await sender.Send(command, ct);
        return TypedResults.Created($"/api/interviews/{id}", id);
    }

    [EndpointSummary("Update interview")]
    public static async Task<Results<NoContent, BadRequest>> UpdateInterview(ISender sender, int id, UpdateInterviewCommand command, CancellationToken ct = default)
    {
        if (id != command.Id) return TypedResults.BadRequest();
        await sender.Send(command, ct);
        return TypedResults.NoContent();
    }

    [EndpointSummary("Delete interview")]
    public static async Task<NoContent> DeleteInterview(ISender sender, int id, CancellationToken ct = default)
    {
        await sender.Send(new DeleteInterviewCommand(id), ct);
        return TypedResults.NoContent();
    }
}
