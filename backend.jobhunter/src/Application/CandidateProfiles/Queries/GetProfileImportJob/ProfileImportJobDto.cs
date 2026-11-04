using System.Text.Json;
using backend.jobhunter.Application.Common.Interfaces;
using backend.jobhunter.Domain.Entities;

namespace backend.jobhunter.Application.CandidateProfiles.Queries.GetProfileImportJob;

public record ProfileImportJobDto(
    int Id,
    int CvId,
    string FileName,
    // Pending, Running, Completed or Failed.
    string Status,
    string? Error,
    // The parsed profile, only when Completed.
    ParsedProfileDto? Result,
    DateTimeOffset Created);

internal static class ProfileImportJobMapping
{
    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web);

    public static string Serialize(ParsedProfileDto result) => JsonSerializer.Serialize(result, Json);

    public static ProfileImportJobDto ToDto(this ProfileImportJob job, string fileName) => new(
        job.Id, job.CvId, fileName, job.Status.ToString(),
        job.Status == Domain.Enums.ProfileImportStatus.Failed ? job.Error : null,
        job.Status == Domain.Enums.ProfileImportStatus.Completed && job.ResultJson is not null
            ? JsonSerializer.Deserialize<ParsedProfileDto>(job.ResultJson, Json)
            : null,
        job.Created);
}
