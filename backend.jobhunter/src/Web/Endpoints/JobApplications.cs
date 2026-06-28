using backend.jobhunter.Application.JobApplications.Commands.CreateJobApplication;
using backend.jobhunter.Application.JobApplications.Commands.DeleteJobApplication;
using backend.jobhunter.Application.JobApplications.Commands.UpdateJobApplication;
using backend.jobhunter.Application.JobApplications.Commands.UpdateJobApplicationStatus;
using backend.jobhunter.Application.JobApplications.Queries.GetFollowUps;
using backend.jobhunter.Application.JobApplications.Queries.GetJobApplication;
using backend.jobhunter.Application.JobApplications.Queries.GetJobApplications;
using Microsoft.AspNetCore.Http.HttpResults;

namespace backend.jobhunter.Web.Endpoints;

public class JobApplications : IEndpointGroup
{
    public static string? RoutePrefix => "/api/applications";

    public static void Map(RouteGroupBuilder group)
    {
        group.RequireAuthorization();
        group.MapGet(GetApplications);
        group.MapGet(GetApplication, "{id}");
        group.MapGet(GetFollowUpsToday, "follow-ups/today");
        group.MapGet(GetFollowUpsOverdue, "follow-ups/overdue");
        group.MapGet(GetFollowUpsThisWeek, "follow-ups/week");
        group.MapPost(CreateApplication);
        group.MapPut(UpdateApplication, "{id}");
        group.MapPatch(UpdateApplicationStatus, "{id}/status");
        group.MapDelete(DeleteApplication, "{id}");
    }

    [EndpointSummary("List applications with filters")]
    public static async Task<Ok<GetJobApplicationsResult>> GetApplications(
        ISender sender,
        int? candidateId, int? companyId, string? status, string? priority,
        string? country, string? workType, string? source,
        DateTimeOffset? dateFrom, DateTimeOffset? dateTo, string? search,
        int page = 1, int pageSize = 50,
        CancellationToken ct = default)
        => TypedResults.Ok(await sender.Send(
            new GetJobApplicationsQuery(candidateId, companyId, status, priority, country, workType, source, dateFrom, dateTo, search, page, pageSize), ct));

    [EndpointSummary("Get application by ID")]
    public static async Task<Ok<JobApplicationDetailDto>> GetApplication(ISender sender, int id, CancellationToken ct = default)
        => TypedResults.Ok(await sender.Send(new GetJobApplicationQuery(id), ct));

    [EndpointSummary("Follow-ups due today")]
    public static async Task<Ok<IReadOnlyList<FollowUpApplicationDto>>> GetFollowUpsToday(ISender sender, CancellationToken ct = default)
        => TypedResults.Ok(await sender.Send(new GetFollowUpsQuery(FollowUpFilter.Today), ct));

    [EndpointSummary("Overdue follow-ups")]
    public static async Task<Ok<IReadOnlyList<FollowUpApplicationDto>>> GetFollowUpsOverdue(ISender sender, CancellationToken ct = default)
        => TypedResults.Ok(await sender.Send(new GetFollowUpsQuery(FollowUpFilter.Overdue), ct));

    [EndpointSummary("Follow-ups this week")]
    public static async Task<Ok<IReadOnlyList<FollowUpApplicationDto>>> GetFollowUpsThisWeek(ISender sender, CancellationToken ct = default)
        => TypedResults.Ok(await sender.Send(new GetFollowUpsQuery(FollowUpFilter.ThisWeek), ct));

    [EndpointSummary("Create application")]
    public static async Task<Created<int>> CreateApplication(ISender sender, CreateJobApplicationCommand command, CancellationToken ct = default)
    {
        var id = await sender.Send(command, ct);
        return TypedResults.Created($"/api/applications/{id}", id);
    }

    [EndpointSummary("Update application")]
    public static async Task<Results<NoContent, BadRequest>> UpdateApplication(ISender sender, int id, UpdateJobApplicationCommand command, CancellationToken ct = default)
    {
        if (id != command.Id) return TypedResults.BadRequest();
        await sender.Send(command, ct);
        return TypedResults.NoContent();
    }

    [EndpointSummary("Update application status")]
    public static async Task<NoContent> UpdateApplicationStatus(ISender sender, int id, UpdateJobApplicationStatusCommand command, CancellationToken ct = default)
    {
        await sender.Send(command with { Id = id }, ct);
        return TypedResults.NoContent();
    }

    [EndpointSummary("Delete application")]
    public static async Task<NoContent> DeleteApplication(ISender sender, int id, CancellationToken ct = default)
    {
        await sender.Send(new DeleteJobApplicationCommand(id), ct);
        return TypedResults.NoContent();
    }
}
