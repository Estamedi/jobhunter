using backend.jobhunter.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace backend.jobhunter.Infrastructure.Data.Configurations;

public class JobInterviewConfiguration : IEntityTypeConfiguration<JobInterview>
{
    public void Configure(EntityTypeBuilder<JobInterview> builder)
    {
        builder.Property(i => i.Round).HasMaxLength(50).IsRequired();
        builder.Property(i => i.InterviewerName).HasMaxLength(200);
        builder.Property(i => i.InterviewerEmail).HasMaxLength(200);
        builder.Property(i => i.MeetingLink).HasMaxLength(1000);
        builder.Property(i => i.Status).HasMaxLength(50).IsRequired();

        builder.HasOne(i => i.Application)
            .WithMany(a => a.Interviews)
            .HasForeignKey(i => i.ApplicationId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(i => i.Candidate)
            .WithMany(c => c.Interviews)
            .HasForeignKey(i => i.CandidateId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(i => i.Company)
            .WithMany()
            .HasForeignKey(i => i.CompanyId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(i => i.ApplicationId);
        builder.HasIndex(i => i.CandidateId);
        builder.HasIndex(i => i.InterviewDate);
    }
}
