using backend.jobhunter.Domain.Enums;

namespace backend.jobhunter.Application.CandidateProfiles;

public interface ISkillInput
{
    string Name { get; }
    string? Category { get; }
    string? EvidenceLevel { get; }
    string? Note { get; }
}

public static class SkillRules
{
    public const int MaxNoteLength = 300;

    public static void Apply<T>(AbstractValidator<T> validator) where T : ISkillInput
    {
        validator.RuleFor(x => x.Name).NotEmpty().MaximumLength(100);
        validator.RuleFor(x => x.Category).MaximumLength(100);
        validator.RuleFor(x => x.EvidenceLevel)
            .Must(v => string.IsNullOrWhiteSpace(v) || Enum.TryParse<SkillEvidenceLevel>(v, true, out _))
            .WithMessage($"Evidence level must be one of: {string.Join(", ", Enum.GetNames<SkillEvidenceLevel>())}.");
        validator.RuleFor(x => x.Note).MaximumLength(MaxNoteLength);
    }

    public static string? CleanNote(string? note)
        => string.IsNullOrWhiteSpace(note) ? null : note.ReplaceLineEndings(" ").Trim();
}
