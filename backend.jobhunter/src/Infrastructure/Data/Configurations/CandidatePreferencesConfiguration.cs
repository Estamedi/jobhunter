using backend.jobhunter.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace backend.jobhunter.Infrastructure.Data.Configurations;

public class CandidatePreferencesConfiguration : IEntityTypeConfiguration<CandidatePreferences>
{
    public void Configure(EntityTypeBuilder<CandidatePreferences> builder)
    {
        builder.Property(p => p.WorkStatus).HasMaxLength(50);
        builder.Property(p => p.SearchIntensity).HasMaxLength(50);
        builder.Property(p => p.PrimaryGoal).HasMaxLength(50);
        builder.Property(p => p.SalaryCurrency).HasMaxLength(3);
        builder.Property(p => p.EmploymentTypes).HasMaxLength(200);
        builder.Property(p => p.WorkModes).HasMaxLength(200);
        builder.Property(p => p.RemoteRegions).HasMaxLength(500);
        builder.Property(p => p.CommuteCities).HasMaxLength(1000);
        builder.Property(p => p.WorkAuthorization).HasMaxLength(50);
        builder.Property(p => p.Industries).HasMaxLength(500);

        builder.HasOne(p => p.Candidate)
            .WithOne(c => c.Preferences)
            .HasForeignKey<CandidatePreferences>(p => p.CandidateId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(p => p.CandidateId).IsUnique();
    }
}
