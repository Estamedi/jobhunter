using backend.jobhunter.Application.Companies.Commands.CreateCompany;
using backend.jobhunter.Application.Companies.Commands.DeleteCompany;
using backend.jobhunter.Application.Companies.Commands.UpdateCompany;
using backend.jobhunter.Application.Companies.Queries.GetCompanies;
using backend.jobhunter.Application.Companies.Queries.GetCompany;
using Microsoft.AspNetCore.Http.HttpResults;

namespace backend.jobhunter.Web.Endpoints;

public class Companies : IEndpointGroup
{
    public static void Map(RouteGroupBuilder group)
    {
        group.RequireAuthorization();
        group.MapGet(GetCompanies);
        group.MapGet(GetCompany, "{id}");
        group.MapPost(CreateCompany);
        group.MapPut(UpdateCompany, "{id}");
        group.MapDelete(DeleteCompany, "{id}");
    }

    [EndpointSummary("List companies")]
    public static async Task<Ok<GetCompaniesResult>> GetCompanies(
        ISender sender, string? search, string? priority, string? country, int page = 1, int pageSize = 50,
        CancellationToken ct = default)
        => TypedResults.Ok(await sender.Send(new GetCompaniesQuery(search, priority, country, page, pageSize), ct));

    [EndpointSummary("Get company by ID")]
    public static async Task<Ok<CompanyDetailDto>> GetCompany(ISender sender, int id, CancellationToken ct = default)
        => TypedResults.Ok(await sender.Send(new GetCompanyQuery(id), ct));

    [EndpointSummary("Create company")]
    public static async Task<Created<int>> CreateCompany(ISender sender, CreateCompanyCommand command, CancellationToken ct = default)
    {
        var id = await sender.Send(command, ct);
        return TypedResults.Created($"/api/Companies/{id}", id);
    }

    [EndpointSummary("Update company")]
    public static async Task<Results<NoContent, BadRequest>> UpdateCompany(ISender sender, int id, UpdateCompanyCommand command, CancellationToken ct = default)
    {
        if (id != command.Id) return TypedResults.BadRequest();
        await sender.Send(command, ct);
        return TypedResults.NoContent();
    }

    [EndpointSummary("Delete company")]
    public static async Task<NoContent> DeleteCompany(ISender sender, int id, CancellationToken ct = default)
    {
        await sender.Send(new DeleteCompanyCommand(id), ct);
        return TypedResults.NoContent();
    }
}
