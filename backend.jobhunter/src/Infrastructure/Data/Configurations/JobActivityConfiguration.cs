using backend.jobhunter.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace backend.jobhunter.Infrastructure.Data.Configurations;

public class JobActivityConfiguration : IEntityTypeConfiguration<JobActivity>
{
    public void Configure(EntityTypeBuilder<JobActivity> builder)
    {
        builder.Property(a => a.Type).HasMaxLength(50).IsRequired();
        builder.Property(a => a.Outcome).HasMaxLength(50);

        builder.HasOne(a => a.Candidate)
            .WithMany(c => c.Activities)
            .HasForeignKey(a => a.CandidateId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(a => a.Application)
            .WithMany(ap => ap.Activities)
            .HasForeignKey(a => a.ApplicationId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(a => a.Company)
            .WithMany(c => c.Activities)
            .HasForeignKey(a => a.CompanyId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(a => a.Contact)
            .WithMany(c => c.Activities)
            .HasForeignKey(a => a.ContactId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasIndex(a => a.CandidateId);
        builder.HasIndex(a => a.ApplicationId);
        builder.HasIndex(a => a.ActivityDate);
    }
}
