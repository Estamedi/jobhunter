using backend.jobhunter.Application.CandidateProfiles;
using backend.jobhunter.Application.CandidateProfiles.Commands.AddProfileEducation;
using backend.jobhunter.Application.CandidateProfiles.Commands.AddProfileExperience;
using backend.jobhunter.Application.CandidateProfiles.Commands.AddProfileSkill;
using backend.jobhunter.Application.CandidateProfiles.Commands.DeleteCandidatePhoto;
using backend.jobhunter.Application.CandidateProfiles.Commands.DeleteProfileEducation;
using backend.jobhunter.Application.CandidateProfiles.Commands.DeleteProfileExperience;
using backend.jobhunter.Application.CandidateProfiles.Commands.DeleteProfileSkill;
using backend.jobhunter.Application.CandidateProfiles.Commands.UpdateProfileSkill;
using backend.jobhunter.Application.CandidateProfiles.Commands.ImportProfile;
using backend.jobhunter.Application.CandidateProfiles.Commands.SaveCandidatePhoto;
using backend.jobhunter.Application.CandidateProfiles.Commands.UpdateCandidateContact;
using backend.jobhunter.Application.CandidateProfiles.Commands.UpdateCandidateProfile;
using backend.jobhunter.Application.CandidateProfiles.Commands.UpdateProfileEducation;
using backend.jobhunter.Application.CandidateProfiles.Commands.UpdateProfileExperience;
using backend.jobhunter.Application.CandidateProfiles.Queries.GetCandidatePhoto;
using backend.jobhunter.Application.CandidateProfiles.Queries.GetCandidateProfile;
using backend.jobhunter.Application.CandidateProfiles.Commands.StartProfileImport;
using backend.jobhunter.Application.CandidateProfiles.Queries.GetProfileImportJob;
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
        group.MapPut(UpdateCandidateContact, "contact");
        group.MapPut(SavePhoto, "photo").DisableAntiforgery()
            .WithMetadata(new Microsoft.AspNetCore.Mvc.RequestSizeLimitAttribute(3 * 1024 * 1024));
        group.MapGet(GetPhoto, "photo");
        group.MapDelete(DeletePhoto, "photo");
        group.MapPost(StartImport, "import-jobs");
        group.MapGet(GetLatestImport, "import-jobs/latest");
        group.MapGet(GetImportJob, "import-jobs/{id}");
        group.MapPost(Import, "import");
        group.MapPost(AddExperience, "experiences");
        group.MapPut(UpdateExperience, "experiences/{id}");
        group.MapDelete(DeleteExperience, "experiences/{id}");
        group.MapPost(AddEducation, "educations");
        group.MapPut(UpdateEducation, "educations/{id}");
        group.MapDelete(DeleteEducation, "educations/{id}");
        group.MapPost(AddSkill, "skills");
        group.MapPut(UpdateSkill, "skills/{id}");
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
    public static async Task<NoContent> UpdateCandidateContact(
        ISender sender, UpdateCandidateContactCommand command, CancellationToken ct = default)
    {
        await sender.Send(command, ct);
        return TypedResults.NoContent();
    }

    [EndpointSummary("Start reading an uploaded CV")]
    [EndpointDescription("Queues the AI reading of an uploaded CV (PDF or DOCX) and answers at once with the job. A background worker reads it; poll the job until it is Completed (the result holds the headline, summary, experiences and more) or Failed. Starting again for the same CV returns the same job, and puts a failed one back in the queue. Nothing is saved until the reviewed result is imported.")]
    public static async Task<Accepted<ProfileImportJobDto>> StartImport(
        ISender sender, StartProfileImportCommand command, CancellationToken ct = default)
    {
        var job = await sender.Send(command, ct);
        return TypedResults.Accepted($"/api/CandidateProfiles/import-jobs/{job.Id}", job);
    }

    [EndpointSummary("Get a CV import job")]
    public static async Task<Ok<ProfileImportJobDto>> GetImportJob(ISender sender, int id, CancellationToken ct = default)
        => TypedResults.Ok(await sender.Send(new GetProfileImportJobQuery(id), ct));

    [EndpointSummary("Get the CV import to resume")]
    [EndpointDescription("The newest import for a candidate that is still reading, waiting for review or failed, and less than a day old. No content when there is none.")]
    public static async Task<Results<Ok<ProfileImportJobDto>, NoContent>> GetLatestImport(
        ISender sender, int candidateId, CancellationToken ct = default)
    {
        var job = await sender.Send(new GetLatestProfileImportJobQuery(candidateId), ct);
        return job is null ? TypedResults.NoContent() : TypedResults.Ok(job);
    }

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

    [EndpointSummary("Set the CV photo")]
    [EndpointDescription("Uploads the photo shown on the photo CV template. JPEG or PNG, up to 2 MB; the browser scales it to 3:4 first.")]
    public static async Task<NoContent> SavePhoto(
        ISender sender,
        [Microsoft.AspNetCore.Mvc.FromForm] int candidateId,
        IFormFile file,
        CancellationToken ct = default)
    {
        if (file.Length > CandidatePhotoRules.MaxBytes)
        {
            throw new Application.Common.Exceptions.ValidationException(
                [new FluentValidation.Results.ValidationFailure("file", "The photo is too large.")]);
        }

        using var memory = new MemoryStream();
        await file.CopyToAsync(memory, ct);
        await sender.Send(new SaveCandidatePhotoCommand(candidateId, memory.ToArray()), ct);
        return TypedResults.NoContent();
    }

    [EndpointSummary("Get the CV photo")]
    public static async Task<FileContentHttpResult> GetPhoto(
        ISender sender, HttpContext http, int candidateId, CancellationToken ct = default)
    {
        var photo = await sender.Send(new GetCandidatePhotoQuery(candidateId), ct);
        // The photo can change, so a browser must ask again before reusing it.
        http.Response.Headers.CacheControl = "private, no-cache";
        return TypedResults.File(photo.Data, photo.ContentType);
    }

    [EndpointSummary("Remove the CV photo")]
    public static async Task<NoContent> DeletePhoto(ISender sender, int candidateId, CancellationToken ct = default)
    {
        await sender.Send(new DeleteCandidatePhotoCommand(candidateId), ct);
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

    [EndpointSummary("Update a skill")]
    [EndpointDescription("Changes a skill's name, category, evidence level (Worked, Project, Course, Learning, Claimed) and note.")]
    public static async Task<Results<NoContent, BadRequest>> UpdateSkill(
        ISender sender, int id, UpdateProfileSkillCommand command, CancellationToken ct = default)
    {
        if (id != command.Id) return TypedResults.BadRequest();
        await sender.Send(command, ct);
        return TypedResults.NoContent();
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
