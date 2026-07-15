using backend.jobhunter.Application.Common.Interfaces;
using backend.jobhunter.Application.Cvs.Commands.DeleteCv;
using backend.jobhunter.Application.Cvs.Commands.UploadCv;
using backend.jobhunter.Application.Cvs.Queries.GetCvDownload;
using backend.jobhunter.Application.Cvs.Queries.GetCvs;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;

namespace backend.jobhunter.Web.Endpoints;

public class Cvs : IEndpointGroup
{
    public static void Map(RouteGroupBuilder group)
    {
        group.RequireAuthorization();

        group.MapGet(GetCvs);
        group.MapPost(UploadCv).DisableAntiforgery();
        group.MapGet(DownloadCv, "{id}/download");
        group.MapDelete(DeleteCv, "{id}");
    }

    [EndpointSummary("List CVs")]
    [EndpointDescription("Lists CVs for the current user, optionally filtered by candidate.")]
    public static async Task<Ok<GetCvsResult>> GetCvs(
        ISender sender, int? candidateId, int page = 1, int pageSize = 20, CancellationToken ct = default)
        => TypedResults.Ok(await sender.Send(new GetCvsQuery(candidateId, page, pageSize), ct));

    [EndpointSummary("Upload a CV")]
    [EndpointDescription("Uploads a CV file for a candidate. Attach it to a job application separately via the application's cvId.")]
    public static async Task<Created<int>> UploadCv(
        ISender sender,
        [FromForm] int candidateId,
        IFormFile file,
        CancellationToken ct = default)
    {
        await using var stream = file.OpenReadStream();

        var id = await sender.Send(new UploadCvCommand
        {
            CandidateId = candidateId,
            FileName = file.FileName,
            ContentType = string.IsNullOrWhiteSpace(file.ContentType) ? "application/octet-stream" : file.ContentType,
            FileSizeBytes = file.Length,
            Content = stream,
        }, ct);

        return TypedResults.Created($"/api/Cvs/{id}", id);
    }

    [EndpointSummary("Download a CV")]
    public static async Task<FileStreamHttpResult> DownloadCv(
        ISender sender, IFileStorage fileStorage, int id, CancellationToken ct = default)
    {
        var dto = await sender.Send(new GetCvDownloadQuery(id), ct);
        var stream = await fileStorage.OpenReadAsync(dto.StorageKey, ct);

        return TypedResults.File(stream, dto.ContentType, dto.FileName);
    }

    [EndpointSummary("Delete a CV")]
    public static async Task<NoContent> DeleteCv(ISender sender, int id, CancellationToken ct = default)
    {
        await sender.Send(new DeleteCvCommand(id), ct);
        return TypedResults.NoContent();
    }
}
