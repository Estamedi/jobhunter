using backend.jobhunter.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace backend.jobhunter.Infrastructure.Data.Configurations;

public class CandidateProfileConfiguration : IEntityTypeConfiguration<CandidateProfile>
{
    public void Configure(EntityTypeBuilder<CandidateProfile> builder)
    {
        builder.Property(p => p.Headline).HasMaxLength(220);
        builder.Property(p => p.Summary).HasMaxLength(2600);

        builder.HasOne(p => p.Candidate)
            .WithOne(c => c.Profile)
            .HasForeignKey<CandidateProfile>(p => p.CandidateId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(p => p.ImportedFromCv)
            .WithMany()
            .HasForeignKey(p => p.ImportedFromCvId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasIndex(p => p.CandidateId).IsUnique();
        builder.HasIndex(p => p.ImportedFromCvId);
    }
}
