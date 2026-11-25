using backend.jobhunter.Application.Common.Interfaces;
using backend.jobhunter.Application.JobExtraction.Commands.ExtractJob;
using backend.jobhunter.Application.JobExtraction.Queries.GetJobExtraction;
using Microsoft.AspNetCore.Http.HttpResults;

namespace backend.jobhunter.Web.Endpoints;

public class JobExtraction : IEndpointGroup
{
    public static void Map(RouteGroupBuilder group)
    {
        group.RequireAuthorization();
        group.MapPost(Extract);
        group.MapGet(GetStatus, "status");
    }

    [EndpointSummary("Extract job posting details from page content")]
    [EndpointDescription("Queues a background AI extraction (or returns saved data, or the status of one already running for this URL).")]
    public static async Task<Ok<ExtractedJobDto>> Extract(
        ISender sender, ExtractJobCommand command, CancellationToken ct = default)
        => TypedResults.Ok(await sender.Send(command, ct));

    [EndpointSummary("Get the status of a job extraction")]
    public static async Task<Ok<JobExtractionStatusDto>> GetStatus(
        ISender sender, string url, CancellationToken ct = default)
        => TypedResults.Ok(await sender.Send(new GetJobExtractionQuery(url), ct));
}
