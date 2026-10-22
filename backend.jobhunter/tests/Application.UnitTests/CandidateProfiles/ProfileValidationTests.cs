using backend.jobhunter.Application.CandidateProfiles.Commands.AddProfileEducation;
using backend.jobhunter.Application.CandidateProfiles.Commands.AddProfileExperience;
using backend.jobhunter.Application.CandidateProfiles.Commands.AddProfileLanguage;
using backend.jobhunter.Application.CandidateProfiles.Commands.ImportProfile;
using NUnit.Framework;
using Shouldly;

namespace backend.jobhunter.Application.UnitTests.CandidateProfiles;

public class ProfileValidationTests
{
    private static AddProfileExperienceCommand Experience(
        bool isCurrent = false, DateOnly? end = null, string? employmentType = null,
        string? workplaceType = null, string title = "Technical Lead", string? description = null,
        IReadOnlyList<string>? skills = null)
        => new()
        {
            CandidateId = 1,
            Title = title,
            Company = "Acme",
            IsCurrent = isCurrent,
            StartDate = new DateOnly(2024, 1, 1),
            EndDate = end,
            EmploymentType = employmentType,
            WorkplaceType = workplaceType,
            Description = description,
            Skills = skills,
        };

    private readonly AddProfileExperienceCommandValidator _experience = new();

    [Test]
    public void ShouldAcceptPastRoleWithEndDate()
        => _experience.Validate(Experience(end: new DateOnly(2025, 1, 1))).IsValid.ShouldBeTrue();

    [Test]
    public void ShouldAcceptCurrentRoleWithoutEndDate()
        => _experience.Validate(Experience(isCurrent: true)).IsValid.ShouldBeTrue();

    [Test]
    public void ShouldRejectCurrentRoleWithEndDate()
        => _experience.Validate(Experience(isCurrent: true, end: new DateOnly(2025, 1, 1))).IsValid.ShouldBeFalse();

    [Test]
    public void ShouldRejectPastRoleWithoutEndDate()
        => _experience.Validate(Experience()).IsValid.ShouldBeFalse();

    [Test]
    public void ShouldRejectEndDateBeforeStartDate()
        => _experience.Validate(Experience(end: new DateOnly(2023, 1, 1))).IsValid.ShouldBeFalse();

    [Test]
    public void ShouldRejectUnknownEnumValues()
    {
        _experience.Validate(Experience(isCurrent: true, employmentType: "Weekend")).IsValid.ShouldBeFalse();
        _experience.Validate(Experience(isCurrent: true, workplaceType: "Moon")).IsValid.ShouldBeFalse();
        _experience.Validate(Experience(isCurrent: true, employmentType: "fulltime", workplaceType: "remote")).IsValid.ShouldBeTrue();
    }

    [Test]
    public void ShouldRejectMissingTitleAndTooLongDescription()
    {
        _experience.Validate(Experience(isCurrent: true, title: "")).IsValid.ShouldBeFalse();
        _experience.Validate(Experience(isCurrent: true, description: new string('x', 2001))).IsValid.ShouldBeFalse();
        _experience.Validate(Experience(isCurrent: true, description: new string('x', 2000))).IsValid.ShouldBeTrue();
    }

    [Test]
    public void ShouldLimitSkillsPerRole()
    {
        var tooMany = Enumerable.Range(0, 51).Select(i => $"skill{i}").ToList();
        _experience.Validate(Experience(isCurrent: true, skills: tooMany)).IsValid.ShouldBeFalse();
        _experience.Validate(Experience(isCurrent: true, skills: [new string('x', 101)])).IsValid.ShouldBeFalse();
    }

    [Test]
    public void ShouldValidateEducation()
    {
        var validator = new AddProfileEducationCommandValidator();

        validator.Validate(new AddProfileEducationCommand
        {
            CandidateId = 1, Institution = "Uni", Degree = "BSc",
            StartDate = new DateOnly(2010, 1, 1), EndDate = new DateOnly(2012, 1, 1),
        }).IsValid.ShouldBeTrue();

        validator.Validate(new AddProfileEducationCommand
        {
            CandidateId = 1, Institution = "Uni", Degree = "BSc",
            StartDate = new DateOnly(2012, 1, 1), EndDate = new DateOnly(2010, 1, 1),
        }).IsValid.ShouldBeFalse();

        validator.Validate(new AddProfileEducationCommand { CandidateId = 1, Institution = "", Degree = "BSc" })
            .IsValid.ShouldBeFalse();
    }

    [Test]
    public void ShouldValidateLanguageProficiency()
    {
        var validator = new AddProfileLanguageCommandValidator();

        validator.Validate(new AddProfileLanguageCommand { CandidateId = 1, Name = "English", Proficiency = "FullProfessional" })
            .IsValid.ShouldBeTrue();
        validator.Validate(new AddProfileLanguageCommand { CandidateId = 1, Name = "English", Proficiency = "Fluent" })
            .IsValid.ShouldBeFalse();
    }

    [Test]
    public void ShouldValidateImportModeAndNestedItems()
    {
        var validator = new ImportProfileCommandValidator();

        validator.Validate(new ImportProfileCommand { CandidateId = 1, Mode = "Merge" }).IsValid.ShouldBeTrue();
        validator.Validate(new ImportProfileCommand { CandidateId = 1, Mode = "replace" }).IsValid.ShouldBeTrue();
        validator.Validate(new ImportProfileCommand { CandidateId = 1, Mode = "Overwrite" }).IsValid.ShouldBeFalse();

        var badExperience = new ImportedExperience
        {
            Title = "Dev", Company = "Acme", StartDate = new DateOnly(2024, 1, 1), IsCurrent = true,
            EndDate = new DateOnly(2025, 1, 1),
        };
        validator.Validate(new ImportProfileCommand { CandidateId = 1, Experiences = [badExperience] })
            .IsValid.ShouldBeFalse();
    }
}
