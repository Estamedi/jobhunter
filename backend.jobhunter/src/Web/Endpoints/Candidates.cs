using backend.jobhunter.Application.Candidates.Commands.ArchiveCandidate;
using backend.jobhunter.Application.Candidates.Commands.CreateCandidate;
using backend.jobhunter.Application.Candidates.Commands.DeleteCandidate;
using backend.jobhunter.Application.Candidates.Commands.UpdateCandidate;
using backend.jobhunter.Application.Candidates.Queries.GetCandidate;
using backend.jobhunter.Application.Candidates.Queries.GetCandidates;
using backend.jobhunter.Application.Dashboard.Queries.GetCandidateDashboard;
using Microsoft.AspNetCore.Http.HttpResults;

namespace backend.jobhunter.Web.Endpoints;

public class Candidates : IEndpointGroup
{
    public static void Map(RouteGroupBuilder group)
    {
        group.RequireAuthorization();
        group.MapGet(GetCandidates);
        group.MapGet(GetCandidate, "{id}");
        group.MapGet(GetCandidateDashboard, "{id}/dashboard");
        group.MapPost(CreateCandidate);
        group.MapPut(UpdateCandidate, "{id}");
        group.MapPatch(ArchiveCandidate, "{id}/archive");
        group.MapDelete(DeleteCandidate, "{id}");
    }

    [EndpointSummary("List candidates")]
    public static async Task<Ok<GetCandidatesResult>> GetCandidates(
        ISender sender, string? search, bool? isActive, int page = 1, int pageSize = 50,
        CancellationToken ct = default)
        => TypedResults.Ok(await sender.Send(new GetCandidatesQuery(search, isActive, page, pageSize), ct));

    [EndpointSummary("Get candidate by ID")]
    public static async Task<Ok<CandidateDetailDto>> GetCandidate(ISender sender, int id, CancellationToken ct = default)
        => TypedResults.Ok(await sender.Send(new GetCandidateQuery(id), ct));

    [EndpointSummary("Get candidate dashboard")]
    public static async Task<Ok<CandidateDashboardDto>> GetCandidateDashboard(ISender sender, int id, CancellationToken ct = default)
        => TypedResults.Ok(await sender.Send(new GetCandidateDashboardQuery(id), ct));

    [EndpointSummary("Create candidate")]
    public static async Task<Created<int>> CreateCandidate(ISender sender, CreateCandidateCommand command, CancellationToken ct = default)
    {
        var id = await sender.Send(command, ct);
        return TypedResults.Created($"/api/Candidates/{id}", id);
    }

    [EndpointSummary("Update candidate")]
    public static async Task<Results<NoContent, BadRequest>> UpdateCandidate(ISender sender, int id, UpdateCandidateCommand command, CancellationToken ct = default)
    {
        if (id != command.Id) return TypedResults.BadRequest();
        await sender.Send(command, ct);
        return TypedResults.NoContent();
    }

    [EndpointSummary("Archive/unarchive candidate")]
    public static async Task<NoContent> ArchiveCandidate(ISender sender, int id, ArchiveCandidateCommand command, CancellationToken ct = default)
    {
        await sender.Send(command with { Id = id }, ct);
        return TypedResults.NoContent();
    }

    [EndpointSummary("Delete candidate")]
    public static async Task<NoContent> DeleteCandidate(ISender sender, int id, CancellationToken ct = default)
    {
        await sender.Send(new DeleteCandidateCommand(id), ct);
        return TypedResults.NoContent();
    }
}
