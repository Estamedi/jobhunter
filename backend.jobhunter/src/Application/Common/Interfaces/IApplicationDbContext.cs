using backend.jobhunter.Domain.Entities;

namespace backend.jobhunter.Application.Common.Interfaces;

public interface IApplicationDbContext
{
    DbSet<Candidate> Candidates { get; }
    DbSet<JobCompany> Companies { get; }
    DbSet<JobContact> Contacts { get; }
    DbSet<JobRole> JobRoles { get; }
    DbSet<JobApplication> Applications { get; }
    DbSet<JobActivity> Activities { get; }
    DbSet<JobInterview> Interviews { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken);
}
