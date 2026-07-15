using backend.jobhunter.Application.Notes.Commands.CreateNote;
using backend.jobhunter.Application.Notes.Commands.DeleteNote;
using backend.jobhunter.Application.Notes.Commands.UpdateNote;
using backend.jobhunter.Application.Notes.Queries.GetNotes;
using Microsoft.AspNetCore.Http.HttpResults;

namespace backend.jobhunter.Web.Endpoints;

public class Notes : IEndpointGroup
{
    public static void Map(RouteGroupBuilder group)
    {
        group.RequireAuthorization();

        group.MapGet(GetNotes);
        group.MapPost(CreateNote);
        group.MapPut(UpdateNote, "{id}");
        group.MapDelete(DeleteNote, "{id}");
    }

    [EndpointSummary("List notes")]
    [EndpointDescription("Lists notes for the current user, optionally filtered by application, with pagination.")]
    public static async Task<Ok<GetNotesResult>> GetNotes(
        ISender sender, int? applicationId, int page = 1, int pageSize = 20, CancellationToken ct = default)
        => TypedResults.Ok(await sender.Send(new GetNotesQuery(applicationId, page, pageSize), ct));

    [EndpointSummary("Create a note")]
    public static async Task<Created<int>> CreateNote(ISender sender, CreateNoteCommand command, CancellationToken ct = default)
    {
        var id = await sender.Send(command, ct);
        return TypedResults.Created($"/api/Notes/{id}", id);
    }

    [EndpointSummary("Update a note")]
    public static async Task<Results<NoContent, BadRequest>> UpdateNote(ISender sender, int id, UpdateNoteCommand command, CancellationToken ct = default)
    {
        if (id != command.Id) return TypedResults.BadRequest();
        await sender.Send(command, ct);
        return TypedResults.NoContent();
    }

    [EndpointSummary("Delete a note")]
    public static async Task<NoContent> DeleteNote(ISender sender, int id, CancellationToken ct = default)
    {
        await sender.Send(new DeleteNoteCommand(id), ct);
        return TypedResults.NoContent();
    }
}
