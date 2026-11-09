using backend.jobhunter.Application.Common.Models;
using backend.jobhunter.Application.Consultations.Commands.SubmitConsultationRequest;
using backend.jobhunter.Application.Consultations.Queries.GetConsultationLeads;
using Microsoft.AspNetCore.Http.HttpResults;

namespace backend.jobhunter.Web.Endpoints;

public class Consultations : IEndpointGroup
{
    public static void Map(RouteGroupBuilder groupBuilder)
    {
        groupBuilder.MapPost(SubmitConsultationRequest).AllowAnonymous();
        groupBuilder.MapGet(GetConsultationLeads).RequireAuthorization();
    }

    [EndpointSummary("Request a consultation")]
    [EndpointDescription("Public. Saves a consultation request sent from the website so an administrator can follow up.")]
    public static async Task<NoContent> SubmitConsultationRequest(
        ISender sender, SubmitConsultationRequestCommand command, CancellationToken cancellationToken)
    {
        await sender.Send(command, cancellationToken);
        return TypedResults.NoContent();
    }

    [EndpointSummary("List consultation requests")]
    [EndpointDescription("Administrator only. A paged list of the consultation requests sent from the website, newest first.")]
    public static async Task<Ok<PaginatedList<ConsultationLeadDto>>> GetConsultationLeads(
        ISender sender, CancellationToken cancellationToken, string? search = null, int page = 1, int pageSize = 25)
        => TypedResults.Ok(await sender.Send(new GetConsultationLeadsQuery(search, page, pageSize), cancellationToken));
}
