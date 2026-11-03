using System.Text.Json;
using backend.jobhunter.Application.Common.Interfaces;
using backend.jobhunter.Domain.Entities;
using backend.jobhunter.Domain.Enums;

namespace backend.jobhunter.Application.UnitTests.Eval;

// A synthetic candidate and job, with what a good CV must (and must not) say. No real people or data.
public record CvEvalFixture
{
    public string Name { get; init; } = "";
    public FixtureHeader Header { get; init; } = new();
    public FixtureJob Job { get; init; } = new();
    public FixtureProfile Profile { get; init; } = new();
    public FixtureExpect Expect { get; init; } = new();

    public record FixtureHeader
    {
        public string FullName { get; init; } = "";
        public string? Email { get; init; }
        public string? Phone { get; init; }
        public string? Location { get; init; }
    }

    public record FixtureJob
    {
        public string Title { get; init; } = "";
        public string Description { get; init; } = "";
    }

    public record FixtureProfile
    {
        public string? Headline { get; init; }
        public string? Summary { get; init; }
        public List<FixtureRole> Experiences { get; init; } = [];
        public List<FixtureEducation> Educations { get; init; } = [];
        public List<FixtureSkill> Skills { get; init; } = [];
    }

    public record FixtureRole
    {
        public string Title { get; init; } = "";
        public string Company { get; init; } = "";
        public string Start { get; init; } = "";
        public string? End { get; init; }
        public string? Location { get; init; }
        public List<string> Bullets { get; init; } = [];
    }

    public record FixtureEducation
    {
        public string Institution { get; init; } = "";
        public string Degree { get; init; } = "";
        public string? Field { get; init; }
        public string? Start { get; init; }
        public string? End { get; init; }
    }

    public record FixtureSkill
    {
        public string Name { get; init; } = "";
        public string? Category { get; init; }
        public string? Level { get; init; }
        public string? Note { get; init; }
    }

    public record FixtureExpect
    {
        public List<JobRequirementDto> MustHave { get; init; } = [];
        public List<JobRequirementDto> NiceToHave { get; init; } = [];
        // Words that must not appear in the summary, headline or bullets (the skills list is not checked).
        public List<string> ForbidInText { get; init; } = [];
        // Words that must not appear in an experience bullet.
        public List<string> ForbidInBullets { get; init; } = [];
        // Words that must appear somewhere in the CV text.
        public List<string> RequireInText { get; init; } = [];
        // Two words that must never share a bullet or a summary sentence (a tool credited to the wrong project).
        public List<List<string>> ForbidPairs { get; init; } = [];
    }

    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web);

    public static CvEvalFixture Load(string path)
        => JsonSerializer.Deserialize<CvEvalFixture>(File.ReadAllText(path), Json)
           ?? throw new InvalidOperationException($"Could not read fixture {path}");

    public JobRequirementsDto Requirements => new() { MustHave = Expect.MustHave, NiceToHave = Expect.NiceToHave };

    // The profile rows the app would hold, with ids standing in for database ids.
    public CandidateProfile ToProfile()
    {
        var profile = new CandidateProfile { Headline = Profile.Headline, Summary = Profile.Summary };
        var id = 1;
        foreach (var r in Profile.Experiences)
        {
            profile.Experiences.Add(new ProfileExperience
            {
                Id = id++, Title = r.Title, Company = r.Company, StartDate = Month(r.Start)!.Value, EndDate = Month(r.End),
                IsCurrent = r.End is null, Location = r.Location,
                Description = string.Join("\n", r.Bullets.Select(b => "- " + b)),
            });
        }
        id = 1;
        foreach (var e in Profile.Educations)
        {
            profile.Educations.Add(new ProfileEducation
            {
                Id = id++, Institution = e.Institution, Degree = e.Degree, FieldOfStudy = e.Field,
                StartDate = Month(e.Start), EndDate = Month(e.End),
            });
        }
        id = 1;
        foreach (var s in Profile.Skills)
        {
            profile.Skills.Add(new ProfileSkill
            {
                Id = id, Name = s.Name, Category = s.Category, Note = s.Note, SortOrder = id++,
                EvidenceLevel = Enum.TryParse<SkillEvidenceLevel>(s.Level, true, out var level) ? level : null,
            });
        }
        return profile;
    }

    // "2022-03" or just "2022".
    private static DateOnly? Month(string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) return null;
        var parts = value.Split('-');
        return new DateOnly(int.Parse(parts[0]), parts.Length > 1 ? int.Parse(parts[1]) : 1, 1);
    }
}
