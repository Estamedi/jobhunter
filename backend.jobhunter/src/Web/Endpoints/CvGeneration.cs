using backend.jobhunter.Application.CvDrafts.Commands.DeleteCvDraft;
using backend.jobhunter.Application.CvDrafts.Commands.ExportCvDraft;
using backend.jobhunter.Application.CvDrafts.Commands.GenerateCvDraft;
using backend.jobhunter.Application.CvDrafts.Commands.RegenerateCvDraftSection;
using backend.jobhunter.Application.CvDrafts.Commands.UpdateCvDraft;
using backend.jobhunter.Application.CvDrafts.Queries.GetCvDraft;
using backend.jobhunter.Application.CvDrafts.Queries.GetCvDrafts;
using Microsoft.AspNetCore.Http.HttpResults;

namespace backend.jobhunter.Web.Endpoints;

public class CvGeneration : IEndpointGroup
{
    public static void Map(RouteGroupBuilder group)
    {
        group.RequireAuthorization();

        group.MapGet(GetCvDrafts);
        group.MapGet(GetCvDraft, "{id}");
        group.MapPost(GenerateCvDraft);
        group.MapPut(UpdateCvDraft, "{id}");
        group.MapPost(ExportCvDraft, "{id}/export");
        group.MapPost(RegenerateSection, "{id}/regenerate-section");
        group.MapDelete(DeleteCvDraft, "{id}");
    }

    [EndpointSummary("List CV drafts")]
    [EndpointDescription("Lists AI-generated CV drafts for the current user, optionally filtered by candidate or job application.")]
    public static async Task<Ok<GetCvDraftsResult>> GetCvDrafts(
        ISender sender, int? candidateId, int? jobApplicationId, int page = 1, int pageSize = 20, CancellationToken ct = default)
        => TypedResults.Ok(await sender.Send(new GetCvDraftsQuery(candidateId, jobApplicationId, page, pageSize), ct));

    [EndpointSummary("Get a CV draft")]
    public static async Task<Ok<CvDraftDetailDto>> GetCvDraft(ISender sender, int id, CancellationToken ct = default)
        => TypedResults.Ok(await sender.Send(new GetCvDraftQuery(id), ct));

    [EndpointSummary("Generate a CV draft")]
    [EndpointDescription("Runs the configured AI provider server-side to write a CV tailored to the given job title, description and instructions, and saves it as a draft.")]
    public static async Task<Created<CvDraftDetailDto>> GenerateCvDraft(
        ISender sender, GenerateCvDraftCommand command, CancellationToken ct = default)
    {
        var draft = await sender.Send(command, ct);
        return TypedResults.Created($"/api/CvGeneration/{draft.Id}", draft);
    }

    [EndpointSummary("Update a CV draft")]
    public static async Task<Results<Ok<CvDraftDetailDto>, BadRequest>> UpdateCvDraft(
        ISender sender, int id, UpdateCvDraftCommand command, CancellationToken ct = default)
    {
        if (id != command.Id) return TypedResults.BadRequest();
        return TypedResults.Ok(await sender.Send(command, ct));
    }

    [EndpointSummary("Regenerate a CV draft section")]
    [EndpointDescription("Rewrites one section (headline, summary, skills, projects, experience, education, certifications, languages or links) of a draft following the given instruction.")]
    public static async Task<Results<Ok<CvDraftDetailDto>, BadRequest>> RegenerateSection(
        ISender sender, int id, RegenerateCvDraftSectionCommand command, CancellationToken ct = default)
    {
        if (id != command.Id) return TypedResults.BadRequest();
        return TypedResults.Ok(await sender.Send(command, ct));
    }

    [EndpointSummary("Export a CV draft to PDF")]
    [EndpointDescription("Renders the draft with its template and saves the PDF as a regular CV; returns the new CV id.")]
    public static async Task<Created<int>> ExportCvDraft(ISender sender, int id, CancellationToken ct = default)
    {
        var cvId = await sender.Send(new ExportCvDraftCommand(id), ct);
        return TypedResults.Created($"/api/Cvs/{cvId}", cvId);
    }

    [EndpointSummary("Delete a CV draft")]
    public static async Task<NoContent> DeleteCvDraft(ISender sender, int id, CancellationToken ct = default)
    {
        await sender.Send(new DeleteCvDraftCommand(id), ct);
        return TypedResults.NoContent();
    }
}
