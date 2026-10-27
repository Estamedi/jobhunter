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

public class RegenerateCvDraftSectionCommandHandler(
    IApplicationDbContext context, ICvGenerationAiService aiService, IFileStorage fileStorage, ICvTextExtractor textExtractor)
    : IRequestHandler<RegenerateCvDraftSectionCommand, CvDraftDetailDto>
{
    public async Task<CvDraftDetailDto> Handle(RegenerateCvDraftSectionCommand request, CancellationToken cancellationToken)
    {
        var draft = await context.CvDrafts.FindAsync([request.Id], cancellationToken)
            ?? throw new NotFoundException(nameof(CvDraft), request.Id);

        var section = request.Section.ToLowerInvariant();
        var current = CvDraftContent.Deserialize(draft.ContentJson);

        // Same sources as when the draft was generated, including the uploaded CV it was based on.
        var warnings = new List<string>();
        var sourceCv = draft.SourceCvId.HasValue
            ? await context.Cvs.AsNoTracking().FirstOrDefaultAsync(c => c.Id == draft.SourceCvId, cancellationToken)
            : null;
        var sourceCvText = await CvSourceText.ReadAsync(sourceCv, fileStorage, textExtractor, warnings, cancellationToken);
        var background = await CvBackgroundBuilder.BuildAsync(
            context, draft.CandidateId, request.BackgroundText, sourceCvText, cancellationToken);
        warnings.AddRange(background.Warnings);

        var refined = await aiService.RefineSectionAsync(new CvSectionRefineRequest
        {
            Current = current,
            Section = section,
            Instruction = request.Instruction,
            DraftInstructions = draft.Instructions,
            Tone = draft.Tone,
            Language = draft.Language,
            JobTitle = draft.JobTitle,
            JobDescription = draft.JobDescription,
            BackgroundText = background.Text,
        }, cancellationToken);

        // Experience and education facts come from the profile, same as when the draft was generated.
        refined = CvProfileMerger.Merge(refined, background.Profile, []);

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

        warnings.AddRange(CvGroundingValidator.Validate(updated, background.Text));
        return draft.ToDetailDto(warnings);
    }
}
