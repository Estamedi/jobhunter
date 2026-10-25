using backend.jobhunter.Domain.Entities;

namespace backend.jobhunter.Application.Common.Interfaces;

public interface IApplicationDbContext
{
    DbSet<Candidate> Candidates { get; }
    DbSet<JobCompany> Companies { get; }
    DbSet<JobContact> Contacts { get; }
    DbSet<JobRole> JobRoles { get; }
    DbSet<JobTitle> JobTitles { get; }
    DbSet<JobApplication> Applications { get; }
    DbSet<JobActivity> Activities { get; }
    DbSet<JobInterview> Interviews { get; }
    DbSet<Cv> Cvs { get; }
    DbSet<CvDraft> CvDrafts { get; }
    DbSet<CandidateProfile> CandidateProfiles { get; }
    DbSet<CandidatePreferences> CandidatePreferences { get; }
    DbSet<ProfileLink> ProfileLinks { get; }
    DbSet<ProfileExperience> ProfileExperiences { get; }
    DbSet<ProfileEducation> ProfileEducations { get; }
    DbSet<ProfileSkill> ProfileSkills { get; }
    DbSet<ProfileProject> ProfileProjects { get; }
    DbSet<ProfileCertification> ProfileCertifications { get; }
    DbSet<ProfileLanguage> ProfileLanguages { get; }
    DbSet<Note> Notes { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken);
}
