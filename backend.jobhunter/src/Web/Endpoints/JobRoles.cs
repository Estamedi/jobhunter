using backend.jobhunter.Application.JobRoles.Commands.CreateJobRole;
using backend.jobhunter.Application.JobRoles.Commands.DeleteJobRole;
using backend.jobhunter.Application.JobRoles.Commands.UpdateJobRole;
using backend.jobhunter.Application.JobRoles.Queries.GetJobRole;
using backend.jobhunter.Application.JobRoles.Queries.GetJobRoles;
using Microsoft.AspNetCore.Http.HttpResults;

namespace backend.jobhunter.Web.Endpoints;

public class JobRoles : IEndpointGroup
{
    public static string? RoutePrefix => "/api/job-roles";

    public static void Map(RouteGroupBuilder group)
    {
        group.RequireAuthorization();
        group.MapGet(GetJobRoles);
        group.MapGet(GetJobRole, "{id}");
        group.MapPost(CreateJobRole);
        group.MapPut(UpdateJobRole, "{id}");
        group.MapDelete(DeleteJobRole, "{id}");
    }

    [EndpointSummary("List job roles")]
    public static async Task<Ok<GetJobRolesResult>> GetJobRoles(
        ISender sender, string? search, int? companyId, int? jobTitleId, string? roleStatus, string? workType, string? country, string? source, int page = 1, int pageSize = 50,
        CancellationToken ct = default)
        => TypedResults.Ok(await sender.Send(new GetJobRolesQuery(search, companyId, jobTitleId, roleStatus, workType, country, source, page, pageSize), ct));

    [EndpointSummary("Get job role by ID")]
    public static async Task<Ok<JobRoleDetailDto>> GetJobRole(ISender sender, int id, CancellationToken ct = default)
        => TypedResults.Ok(await sender.Send(new GetJobRoleQuery(id), ct));

    [EndpointSummary("Create job role")]
    public static async Task<Created<int>> CreateJobRole(ISender sender, CreateJobRoleCommand command, CancellationToken ct = default)
    {
        var id = await sender.Send(command, ct);
        return TypedResults.Created($"/api/job-roles/{id}", id);
    }

    [EndpointSummary("Update job role")]
    public static async Task<Results<NoContent, BadRequest>> UpdateJobRole(ISender sender, int id, UpdateJobRoleCommand command, CancellationToken ct = default)
    {
        if (id != command.Id) return TypedResults.BadRequest();
        await sender.Send(command, ct);
        return TypedResults.NoContent();
    }

    [EndpointSummary("Delete job role")]
    public static async Task<NoContent> DeleteJobRole(ISender sender, int id, CancellationToken ct = default)
    {
        await sender.Send(new DeleteJobRoleCommand(id), ct);
        return TypedResults.NoContent();
    }
}
