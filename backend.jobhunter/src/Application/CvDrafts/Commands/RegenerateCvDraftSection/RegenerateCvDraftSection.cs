using backend.jobhunter.Application.Common.Interfaces;
using backend.jobhunter.Application.Common.Security;
using backend.jobhunter.Application.CvDrafts.Queries.GetCvDraft;
using backend.jobhunter.Domain.Entities;

namespace backend.jobhunter.Application.CvDrafts.Commands.RegenerateCvDraftSection;

public static class CvSections
{
    public const string Headline = "headline";
    public const string Summary = "summary";
    public const string Skills = "skills";
    public const string Projects = "projects";
    public const string Experience = "experience";
    public const string Education = "education";
    public const string Certifications = "certifications";
    public const string Languages = "languages";
    public const string Links = "links";

    public static readonly string[] All =
        [Headline, Summary, Skills, Projects, Experience, Education, Certifications, Languages, Links];
}

[Authorize]
public record RegenerateCvDraftSectionCommand : IRequest<CvDraftDetailDto>
{
    public required int Id { get; init; }
    public required string Section { get; init; }
    public required string Instruction { get; init; }
    public string? BackgroundText { get; init; }
}

public class RegenerateCvDraftSectionCommandHandler(IApplicationDbContext context, ICvGenerationAiService aiService)
    : IRequestHandler<RegenerateCvDraftSectionCommand, CvDraftDetailDto>
{
    public async Task<CvDraftDetailDto> Handle(RegenerateCvDraftSectionCommand request, CancellationToken cancellationToken)
    {
        var draft = await context.CvDrafts.FindAsync([request.Id], cancellationToken)
            ?? throw new NotFoundException(nameof(CvDraft), request.Id);

        var section = request.Section.ToLowerInvariant();
        var current = CvDraftContent.Deserialize(draft.ContentJson);

        var background = await CvBackgroundBuilder.BuildAsync(
            context, draft.CandidateId, request.BackgroundText, cancellationToken);

        var refined = await aiService.RefineSectionAsync(new CvSectionRefineRequest
        {
            Current = current,
            Section = section,
            Instruction = request.Instruction,
            JobTitle = draft.JobTitle,
            JobDescription = draft.JobDescription,
            BackgroundText = background,
        }, cancellationToken);

        // Take only the requested section from the AI result so nothing else can drift.
        var updated = section switch
        {
            CvSections.Headline => current with { Headline = refined.Headline },
            CvSections.Summary => current with { Summary = refined.Summary },
            CvSections.Skills => current with { Skills = refined.Skills },
            CvSections.Projects => current with { Projects = refined.Projects },
            CvSections.Experience => current with { Experience = refined.Experience },
            CvSections.Education => current with { Education = refined.Education },
            CvSections.Certifications => current with { Certifications = refined.Certifications },
            CvSections.Languages => current with { Languages = refined.Languages },
            CvSections.Links => current with { Links = refined.Links },
            _ => throw new ArgumentOutOfRangeException(nameof(request), section, "Unknown CV section."),
        };

        draft.ContentJson = CvDraftContent.Serialize(updated);
        await context.SaveChangesAsync(cancellationToken);

        return draft.ToDetailDto();
    }
}
