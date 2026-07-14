using backend.jobhunter.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace backend.jobhunter.Infrastructure.Data.Configurations;

public class JobApplicationConfiguration : IEntityTypeConfiguration<JobApplication>
{
    public void Configure(EntityTypeBuilder<JobApplication> builder)
    {
        builder.Property(a => a.Status).HasMaxLength(50).IsRequired();
        builder.Property(a => a.ResumeVersion).HasMaxLength(200);
        builder.Property(a => a.CoverLetterVersion).HasMaxLength(200);
        builder.Property(a => a.Currency).HasMaxLength(10);
        builder.Property(a => a.ExpectedSalary).HasPrecision(18, 2);
        builder.Property(a => a.ActualOfferSalary).HasPrecision(18, 2);

        builder.HasOne(a => a.Candidate)
            .WithMany(c => c.Applications)
            .HasForeignKey(a => a.CandidateId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(a => a.JobRole)
            .WithMany(r => r.Applications)
            .HasForeignKey(a => a.JobRoleId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(a => a.Company)
            .WithMany(c => c.Applications)
            .HasForeignKey(a => a.CompanyId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(a => a.MainContact)
            .WithMany(c => c.Applications)
            .HasForeignKey(a => a.MainContactId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasIndex(a => a.CandidateId);
        builder.HasIndex(a => a.CompanyId);
        builder.HasIndex(a => a.Status);
        builder.HasIndex(a => a.AppliedDate);
        builder.HasIndex(a => a.NextFollowUpDate);
    }
}
