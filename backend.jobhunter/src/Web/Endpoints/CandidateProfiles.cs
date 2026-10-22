using backend.jobhunter.Application.CandidateProfiles;
using backend.jobhunter.Application.CandidateProfiles.Commands.AddProfileExperience;
using backend.jobhunter.Application.CandidateProfiles.Commands.DeleteProfileExperience;
using backend.jobhunter.Application.CandidateProfiles.Commands.UpdateCandidateProfile;
using backend.jobhunter.Application.CandidateProfiles.Commands.UpdateProfileExperience;
using backend.jobhunter.Application.CandidateProfiles.Queries.GetCandidateProfile;
using Microsoft.AspNetCore.Http.HttpResults;

namespace backend.jobhunter.Web.Endpoints;

public class CandidateProfiles : IEndpointGroup
{
    public static void Map(RouteGroupBuilder group)
    {
        group.RequireAuthorization();

        group.MapGet(GetProfile);
        group.MapPut(UpdateProfile, "about");
        group.MapPost(AddExperience, "experiences");
        group.MapPut(UpdateExperience, "experiences/{id}");
        group.MapDelete(DeleteExperience, "experiences/{id}");
    }

    [EndpointSummary("Get a candidate's profile")]
    [EndpointDescription("Returns the profile with its experiences (newest first); an empty profile if none has been saved yet.")]
    public static async Task<Ok<CandidateProfileDto>> GetProfile(
        ISender sender, int candidateId, CancellationToken ct = default)
        => TypedResults.Ok(await sender.Send(new GetCandidateProfileQuery(candidateId), ct));

    [EndpointSummary("Update the profile headline and summary")]
    public static async Task<Ok<int>> UpdateProfile(
        ISender sender, UpdateCandidateProfileCommand command, CancellationToken ct = default)
        => TypedResults.Ok(await sender.Send(command, ct));

    [EndpointSummary("Add an experience")]
    public static async Task<Created<int>> AddExperience(
        ISender sender, AddProfileExperienceCommand command, CancellationToken ct = default)
    {
        var id = await sender.Send(command, ct);
        return TypedResults.Created($"/api/CandidateProfiles/experiences/{id}", id);
    }

    [EndpointSummary("Update an experience")]
    public static async Task<Results<NoContent, BadRequest>> UpdateExperience(
        ISender sender, int id, UpdateProfileExperienceCommand command, CancellationToken ct = default)
    {
        if (id != command.Id) return TypedResults.BadRequest();
        await sender.Send(command, ct);
        return TypedResults.NoContent();
    }

    [EndpointSummary("Delete an experience")]
    public static async Task<NoContent> DeleteExperience(ISender sender, int id, CancellationToken ct = default)
    {
        await sender.Send(new DeleteProfileExperienceCommand(id), ct);
        return TypedResults.NoContent();
    }
}
