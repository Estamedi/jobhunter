using backend.jobhunter.Application.Common.Interfaces;
using backend.jobhunter.Application.JobExtraction.Commands.ExtractJob;
using Microsoft.AspNetCore.Http.HttpResults;

namespace backend.jobhunter.Web.Endpoints;

public class JobExtraction : IEndpointGroup
{
    public static void Map(RouteGroupBuilder group)
    {
        group.RequireAuthorization();
        group.MapPost(Extract);
    }

    [EndpointSummary("Extract job posting details from page content")]
    [EndpointDescription("Runs the configured AI provider server-side against the given page content and returns structured job fields.")]
    public static async Task<Ok<ExtractedJobDto>> Extract(
        ISender sender, ExtractJobCommand command, CancellationToken ct = default)
        => TypedResults.Ok(await sender.Send(command, ct));
}
