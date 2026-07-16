using backend.jobhunter.Application.JobTitles.Commands.CreateJobTitle;
using backend.jobhunter.Application.JobTitles.Commands.DeleteJobTitle;
using backend.jobhunter.Application.JobTitles.Commands.UpdateJobTitle;
using backend.jobhunter.Application.JobTitles.Queries.GetJobTitle;
using backend.jobhunter.Application.JobTitles.Queries.GetJobTitles;
using Microsoft.AspNetCore.Http.HttpResults;

namespace backend.jobhunter.Web.Endpoints;

public class JobTitles : IEndpointGroup
{
    public static string? RoutePrefix => "/api/job-titles";

    public static void Map(RouteGroupBuilder group)
    {
        group.RequireAuthorization();
        group.MapGet(GetJobTitles);
        group.MapGet(GetJobTitle, "{id}");
        group.MapPost(CreateJobTitle);
        group.MapPut(UpdateJobTitle, "{id}");
        group.MapDelete(DeleteJobTitle, "{id}");
    }

    [EndpointSummary("List job titles")]
    public static async Task<Ok<GetJobTitlesResult>> GetJobTitles(
        ISender sender, string? search, int page = 1, int pageSize = 50,
        CancellationToken ct = default)
        => TypedResults.Ok(await sender.Send(new GetJobTitlesQuery(search, page, pageSize), ct));

    [EndpointSummary("Get job title by ID")]
    public static async Task<Ok<JobTitleDetailDto>> GetJobTitle(ISender sender, int id, CancellationToken ct = default)
        => TypedResults.Ok(await sender.Send(new GetJobTitleQuery(id), ct));

    [EndpointSummary("Create job title")]
    public static async Task<Created<int>> CreateJobTitle(ISender sender, CreateJobTitleCommand command, CancellationToken ct = default)
    {
        var id = await sender.Send(command, ct);
        return TypedResults.Created($"/api/job-titles/{id}", id);
    }

    [EndpointSummary("Update job title")]
    public static async Task<Results<NoContent, BadRequest>> UpdateJobTitle(ISender sender, int id, UpdateJobTitleCommand command, CancellationToken ct = default)
    {
        if (id != command.Id) return TypedResults.BadRequest();
        await sender.Send(command, ct);
        return TypedResults.NoContent();
    }

    [EndpointSummary("Delete job title")]
    public static async Task<NoContent> DeleteJobTitle(ISender sender, int id, CancellationToken ct = default)
    {
        await sender.Send(new DeleteJobTitleCommand(id), ct);
        return TypedResults.NoContent();
    }
}
