using backend.jobhunter.Application.CvDrafts;
using backend.jobhunter.Application.CvDrafts.Commands.AnalyzeCvDraftMatch;
using backend.jobhunter.Application.CvDrafts.Commands.DeleteCvDraft;
using backend.jobhunter.Application.CvDrafts.Commands.ExportCvDraft;
using backend.jobhunter.Application.CvDrafts.Commands.GenerateCvDraft;
using backend.jobhunter.Application.CvDrafts.Commands.RegenerateCvDraftSection;
using backend.jobhunter.Application.CvDrafts.Commands.RestoreCvDraftVersion;
using backend.jobhunter.Application.CvDrafts.Commands.UpdateCvDraft;
using backend.jobhunter.Application.CvDrafts.Queries.GetCvDraft;
using backend.jobhunter.Application.CvDrafts.Queries.GetCvDraftScore;
using backend.jobhunter.Application.CvDrafts.Queries.GetCvDraftVersion;
using backend.jobhunter.Application.CvDrafts.Queries.GetCvDraftVersions;
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
        group.MapPost(AnalyzeMatch, "{id}/match");
        group.MapGet(GetScore, "{id}/score");
        group.MapGet(GetVersions, "{id}/versions");
        group.MapGet(GetVersion, "{id}/versions/{versionId}");
        group.MapPost(RestoreVersion, "{id}/versions/{versionId}/restore");
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

    [EndpointSummary("Check a CV draft against its job description")]
    [EndpointDescription("Lists the skills the draft's job description asks for and whether the CV or the candidate's profile covers each. The first call asks the AI to read the job description and caches the result on the draft.")]
    public static async Task<Ok<CvJobMatchDto>> AnalyzeMatch(ISender sender, int id, CancellationToken ct = default)
        => TypedResults.Ok(await sender.Send(new AnalyzeCvDraftMatchCommand(id), ct));

    [EndpointSummary("Score a CV draft")]
    [EndpointDescription("Scores the saved CV with fixed rules: an overall score out of 100 and a score out of 10 per check, each with the lines that cost points.")]
    public static async Task<Ok<CvScoreDto>> GetScore(ISender sender, int id, CancellationToken ct = default)
        => TypedResults.Ok(await sender.Send(new GetCvDraftScoreQuery(id), ct));

    [EndpointSummary("List earlier versions of a CV draft")]
    [EndpointDescription("The last 20 saved copies of the draft's content, newest first. A copy is saved just before a hand edit, a section refine or a restore replaces the content.")]
    public static async Task<Ok<IReadOnlyList<CvDraftVersionSummaryDto>>> GetVersions(
        ISender sender, int id, CancellationToken ct = default)
        => TypedResults.Ok(await sender.Send(new GetCvDraftVersionsQuery(id), ct));

    [EndpointSummary("Get one earlier version of a CV draft")]
    public static async Task<Ok<CvDraftVersionDetailDto>> GetVersion(
        ISender sender, int id, int versionId, CancellationToken ct = default)
        => TypedResults.Ok(await sender.Send(new GetCvDraftVersionQuery(id, versionId), ct));

    [EndpointSummary("Restore an earlier version of a CV draft")]
    [EndpointDescription("Replaces the draft's content with the chosen version. The current content is saved first, so the restore can be undone.")]
    public static async Task<Ok<CvDraftDetailDto>> RestoreVersion(
        ISender sender, int id, int versionId, CancellationToken ct = default)
        => TypedResults.Ok(await sender.Send(new RestoreCvDraftVersionCommand(id, versionId), ct));

    [EndpointSummary("Regenerate a CV draft section")]
    [EndpointDescription("Rewrites one section (headline, summary, skills, projects, experience, education, certifications, languages or links) of a draft following the given instruction.")]
    public static async Task<Results<Ok<CvDraftDetailDto>, BadRequest>> RegenerateSection(
        ISender sender, int id, RegenerateCvDraftSectionCommand command, CancellationToken ct = default)
    {
        if (id != command.Id) return TypedResults.BadRequest();
        return TypedResults.Ok(await sender.Send(command, ct));
    }

    [EndpointSummary("Export a CV draft to PDF")]
    [EndpointDescription("Renders the draft with its template and saves the PDF as a regular CV. If the draft is linked to an application without a CV, the PDF is attached to it.")]
    public static async Task<Created<ExportCvDraftResult>> ExportCvDraft(ISender sender, int id, CancellationToken ct = default)
    {
        var result = await sender.Send(new ExportCvDraftCommand(id), ct);
        return TypedResults.Created($"/api/Cvs/{result.CvId}", result);
    }

    [EndpointSummary("Delete a CV draft")]
    public static async Task<NoContent> DeleteCvDraft(ISender sender, int id, CancellationToken ct = default)
    {
        await sender.Send(new DeleteCvDraftCommand(id), ct);
        return TypedResults.NoContent();
    }
}
