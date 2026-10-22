using System.Text.Json;
using backend.jobhunter.Application.Common.Interfaces;

namespace backend.jobhunter.Application.CvDrafts;

public static class CvDraftContent
{
    private static readonly JsonSerializerOptions Options = new(JsonSerializerDefaults.Web);

    public static string Serialize(GeneratedCvDto cv) => JsonSerializer.Serialize(cv, Options);

    public static GeneratedCvDto Deserialize(string json)
        => JsonSerializer.Deserialize<GeneratedCvDto>(json, Options) ?? new GeneratedCvDto();
}
