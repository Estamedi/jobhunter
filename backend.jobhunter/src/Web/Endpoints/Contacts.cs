using backend.jobhunter.Application.Contacts.Commands.CreateContact;
using backend.jobhunter.Application.Contacts.Commands.DeleteContact;
using backend.jobhunter.Application.Contacts.Commands.UpdateContact;
using backend.jobhunter.Application.Contacts.Queries.GetContact;
using backend.jobhunter.Application.Contacts.Queries.GetContacts;
using Microsoft.AspNetCore.Http.HttpResults;

namespace backend.jobhunter.Web.Endpoints;

public class Contacts : IEndpointGroup
{
    public static void Map(RouteGroupBuilder group)
    {
        group.RequireAuthorization();
        group.MapGet(GetContacts);
        group.MapGet(GetContact, "{id}");
        group.MapPost(CreateContact);
        group.MapPut(UpdateContact, "{id}");
        group.MapDelete(DeleteContact, "{id}");
    }

    [EndpointSummary("List contacts")]
    public static async Task<Ok<GetContactsResult>> GetContacts(
        ISender sender, string? search, int? companyId, string? type, string? warmth, int page = 1, int pageSize = 50,
        CancellationToken ct = default)
        => TypedResults.Ok(await sender.Send(new GetContactsQuery(search, companyId, type, warmth, page, pageSize), ct));

    [EndpointSummary("Get contact by ID")]
    public static async Task<Ok<ContactDetailDto>> GetContact(ISender sender, int id, CancellationToken ct = default)
        => TypedResults.Ok(await sender.Send(new GetContactQuery(id), ct));

    [EndpointSummary("Create contact")]
    public static async Task<Created<int>> CreateContact(ISender sender, CreateContactCommand command, CancellationToken ct = default)
    {
        var id = await sender.Send(command, ct);
        return TypedResults.Created($"/api/Contacts/{id}", id);
    }

    [EndpointSummary("Update contact")]
    public static async Task<Results<NoContent, BadRequest>> UpdateContact(ISender sender, int id, UpdateContactCommand command, CancellationToken ct = default)
    {
        if (id != command.Id) return TypedResults.BadRequest();
        await sender.Send(command, ct);
        return TypedResults.NoContent();
    }

    [EndpointSummary("Delete contact")]
    public static async Task<NoContent> DeleteContact(ISender sender, int id, CancellationToken ct = default)
    {
        await sender.Send(new DeleteContactCommand(id), ct);
        return TypedResults.NoContent();
    }
}
