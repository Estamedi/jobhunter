using backend.jobhunter.Application.OnboardingPreferences.Commands.SaveCandidatePreferences;
using backend.jobhunter.Application.OnboardingPreferences.Queries.GetCandidatePreferences;
using Microsoft.AspNetCore.Http.HttpResults;

namespace backend.jobhunter.Web.Endpoints;

public class CandidatePreferences : IEndpointGroup
{
    public static void Map(RouteGroupBuilder group)
    {
        group.RequireAuthorization();
        group.MapGet(GetPreferences, "");
        group.MapPut(SavePreferences, "");
    }

    [EndpointSummary("Get a candidate's onboarding preferences")]
    public static async Task<Ok<CandidatePreferencesDto>> GetPreferences(ISender sender, int candidateId, CancellationToken ct = default)
        => TypedResults.Ok(await sender.Send(new GetCandidatePreferencesQuery(candidateId), ct));

    [EndpointSummary("Save a candidate's onboarding preferences")]
    public static async Task<NoContent> SavePreferences(ISender sender, SaveCandidatePreferencesCommand command, CancellationToken ct = default)
    {
        await sender.Send(command, ct);
        return TypedResults.NoContent();
    }
}
