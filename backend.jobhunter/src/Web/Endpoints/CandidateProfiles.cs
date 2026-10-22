using backend.jobhunter.Application.CandidateProfiles;
using backend.jobhunter.Application.CandidateProfiles.Commands.AddProfileEducation;
using backend.jobhunter.Application.CandidateProfiles.Commands.AddProfileExperience;
using backend.jobhunter.Application.CandidateProfiles.Commands.AddProfileSkill;
using backend.jobhunter.Application.CandidateProfiles.Commands.DeleteProfileEducation;
using backend.jobhunter.Application.CandidateProfiles.Commands.DeleteProfileExperience;
using backend.jobhunter.Application.CandidateProfiles.Commands.DeleteProfileSkill;
using backend.jobhunter.Application.CandidateProfiles.Commands.ImportProfile;
using backend.jobhunter.Application.CandidateProfiles.Commands.UpdateCandidateContact;
using backend.jobhunter.Application.CandidateProfiles.Commands.UpdateCandidateProfile;
using backend.jobhunter.Application.CandidateProfiles.Commands.UpdateProfileEducation;
using backend.jobhunter.Application.CandidateProfiles.Commands.UpdateProfileExperience;
using backend.jobhunter.Application.CandidateProfiles.Queries.GetCandidateProfile;
using backend.jobhunter.Application.CandidateProfiles.Queries.PreviewProfileImport;
using backend.jobhunter.Application.Common.Interfaces;
using backend.jobhunter.Application.CandidateProfiles.Commands.AddProfileProject;
using backend.jobhunter.Application.CandidateProfiles.Commands.DeleteProfileProject;
using backend.jobhunter.Application.CandidateProfiles.Commands.UpdateProfileProject;
using backend.jobhunter.Application.CandidateProfiles.Commands.AddProfileCertification;
using backend.jobhunter.Application.CandidateProfiles.Commands.DeleteProfileCertification;
using backend.jobhunter.Application.CandidateProfiles.Commands.UpdateProfileCertification;
using backend.jobhunter.Application.CandidateProfiles.Commands.AddProfileLanguage;
using backend.jobhunter.Application.CandidateProfiles.Commands.DeleteProfileLanguage;
using backend.jobhunter.Application.CandidateProfiles.Commands.UpdateProfileLanguage;
using backend.jobhunter.Application.CandidateProfiles.Commands.AddProfileLink;
using backend.jobhunter.Application.CandidateProfiles.Commands.DeleteProfileLink;
using backend.jobhunter.Application.CandidateProfiles.Commands.UpdateProfileLink;
using Microsoft.AspNetCore.Http.HttpResults;

namespace backend.jobhunter.Web.Endpoints;

public class CandidateProfiles : IEndpointGroup
{
    public static void Map(RouteGroupBuilder group)
    {
        group.RequireAuthorization();

        group.MapGet(GetProfile);
        group.MapPut(UpdateProfile, "about");
        group.MapPut(UpdateContact, "contact");
        group.MapPost(PreviewImport, "import-preview");
        group.MapPost(Import, "import");
        group.MapPost(AddExperience, "experiences");
        group.MapPut(UpdateExperience, "experiences/{id}");
        group.MapDelete(DeleteExperience, "experiences/{id}");
        group.MapPost(AddEducation, "educations");
        group.MapPut(UpdateEducation, "educations/{id}");
        group.MapDelete(DeleteEducation, "educations/{id}");
        group.MapPost(AddSkill, "skills");
        group.MapDelete(DeleteSkill, "skills/{id}");
        group.MapPost(AddProject, "projects");
        group.MapPut(UpdateProject, "projects/{id}");
        group.MapDelete(DeleteProject, "projects/{id}");
        group.MapPost(AddCertification, "certifications");
        group.MapPut(UpdateCertification, "certifications/{id}");
        group.MapDelete(DeleteCertification, "certifications/{id}");
        group.MapPost(AddLanguage, "languages");
        group.MapPut(UpdateLanguage, "languages/{id}");
        group.MapDelete(DeleteLanguage, "languages/{id}");
        group.MapPost(AddLink, "links");
        group.MapPut(UpdateLink, "links/{id}");
        group.MapDelete(DeleteLink, "links/{id}");
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

    [EndpointSummary("Update the contact details shown on the CV")]
    [EndpointDescription("Updates the candidate's name, email, phone and location (the CV header).")]
    public static async Task<NoContent> UpdateContact(
        ISender sender, UpdateCandidateContactCommand command, CancellationToken ct = default)
    {
        await sender.Send(command, ct);
        return TypedResults.NoContent();
    }

    [EndpointSummary("Preview a profile import from an uploaded CV")]
    [EndpointDescription("Reads the text of an uploaded CV (PDF or DOCX) and has the AI extract the headline, summary and experiences. Nothing is saved.")]
    public static async Task<Ok<ParsedProfileDto>> PreviewImport(
        ISender sender, PreviewProfileImportQuery query, CancellationToken ct = default)
        => TypedResults.Ok(await sender.Send(query, ct));

    [EndpointSummary("Save a reviewed profile import")]
    [EndpointDescription("Merges or replaces the profile with the reviewed import result; returns how many experiences were added.")]
    public static async Task<Ok<int>> Import(
        ISender sender, ImportProfileCommand command, CancellationToken ct = default)
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

    [EndpointSummary("Add an education")]
    public static async Task<Created<int>> AddEducation(
        ISender sender, AddProfileEducationCommand command, CancellationToken ct = default)
    {
        var id = await sender.Send(command, ct);
        return TypedResults.Created($"/api/CandidateProfiles/educations/{id}", id);
    }

    [EndpointSummary("Update an education")]
    public static async Task<Results<NoContent, BadRequest>> UpdateEducation(
        ISender sender, int id, UpdateProfileEducationCommand command, CancellationToken ct = default)
    {
        if (id != command.Id) return TypedResults.BadRequest();
        await sender.Send(command, ct);
        return TypedResults.NoContent();
    }

    [EndpointSummary("Delete an education")]
    public static async Task<NoContent> DeleteEducation(ISender sender, int id, CancellationToken ct = default)
    {
        await sender.Send(new DeleteProfileEducationCommand(id), ct);
        return TypedResults.NoContent();
    }

    [EndpointSummary("Add a skill")]
    [EndpointDescription("Adds a skill to the profile; a skill that is already there returns the existing one.")]
    public static async Task<Created<int>> AddSkill(
        ISender sender, AddProfileSkillCommand command, CancellationToken ct = default)
    {
        var id = await sender.Send(command, ct);
        return TypedResults.Created($"/api/CandidateProfiles/skills/{id}", id);
    }

    [EndpointSummary("Delete a skill")]
    public static async Task<NoContent> DeleteSkill(ISender sender, int id, CancellationToken ct = default)
    {
        await sender.Send(new DeleteProfileSkillCommand(id), ct);
        return TypedResults.NoContent();
    }

    [EndpointSummary("Add a project")]
    public static async Task<Created<int>> AddProject(
        ISender sender, AddProfileProjectCommand command, CancellationToken ct = default)
    {
        var id = await sender.Send(command, ct);
        return TypedResults.Created($"/api/CandidateProfiles/projects/{id}", id);
    }

    [EndpointSummary("Update a project")]
    public static async Task<Results<NoContent, BadRequest>> UpdateProject(
        ISender sender, int id, UpdateProfileProjectCommand command, CancellationToken ct = default)
    {
        if (id != command.Id) return TypedResults.BadRequest();
        await sender.Send(command, ct);
        return TypedResults.NoContent();
    }

    [EndpointSummary("Delete a project")]
    public static async Task<NoContent> DeleteProject(ISender sender, int id, CancellationToken ct = default)
    {
        await sender.Send(new DeleteProfileProjectCommand(id), ct);
        return TypedResults.NoContent();
    }

    [EndpointSummary("Add a certification")]
    public static async Task<Created<int>> AddCertification(
        ISender sender, AddProfileCertificationCommand command, CancellationToken ct = default)
    {
        var id = await sender.Send(command, ct);
        return TypedResults.Created($"/api/CandidateProfiles/certifications/{id}", id);
    }

    [EndpointSummary("Update a certification")]
    public static async Task<Results<NoContent, BadRequest>> UpdateCertification(
        ISender sender, int id, UpdateProfileCertificationCommand command, CancellationToken ct = default)
    {
        if (id != command.Id) return TypedResults.BadRequest();
        await sender.Send(command, ct);
        return TypedResults.NoContent();
    }

    [EndpointSummary("Delete a certification")]
    public static async Task<NoContent> DeleteCertification(ISender sender, int id, CancellationToken ct = default)
    {
        await sender.Send(new DeleteProfileCertificationCommand(id), ct);
        return TypedResults.NoContent();
    }

    [EndpointSummary("Add a language")]
    public static async Task<Created<int>> AddLanguage(
        ISender sender, AddProfileLanguageCommand command, CancellationToken ct = default)
    {
        var id = await sender.Send(command, ct);
        return TypedResults.Created($"/api/CandidateProfiles/languages/{id}", id);
    }

    [EndpointSummary("Update a language")]
    public static async Task<Results<NoContent, BadRequest>> UpdateLanguage(
        ISender sender, int id, UpdateProfileLanguageCommand command, CancellationToken ct = default)
    {
        if (id != command.Id) return TypedResults.BadRequest();
        await sender.Send(command, ct);
        return TypedResults.NoContent();
    }

    [EndpointSummary("Delete a language")]
    public static async Task<NoContent> DeleteLanguage(ISender sender, int id, CancellationToken ct = default)
    {
        await sender.Send(new DeleteProfileLanguageCommand(id), ct);
        return TypedResults.NoContent();
    }

    [EndpointSummary("Add a link")]
    public static async Task<Created<int>> AddLink(
        ISender sender, AddProfileLinkCommand command, CancellationToken ct = default)
    {
        var id = await sender.Send(command, ct);
        return TypedResults.Created($"/api/CandidateProfiles/links/{id}", id);
    }

    [EndpointSummary("Update a link")]
    public static async Task<Results<NoContent, BadRequest>> UpdateLink(
        ISender sender, int id, UpdateProfileLinkCommand command, CancellationToken ct = default)
    {
        if (id != command.Id) return TypedResults.BadRequest();
        await sender.Send(command, ct);
        return TypedResults.NoContent();
    }

    [EndpointSummary("Delete a link")]
    public static async Task<NoContent> DeleteLink(ISender sender, int id, CancellationToken ct = default)
    {
        await sender.Send(new DeleteProfileLinkCommand(id), ct);
        return TypedResults.NoContent();
    }

    [EndpointSummary("Delete an experience")]
    public static async Task<NoContent> DeleteExperience(ISender sender, int id, CancellationToken ct = default)
    {
        await sender.Send(new DeleteProfileExperienceCommand(id), ct);
        return TypedResults.NoContent();
    }
}
