using backend.jobhunter.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace backend.jobhunter.Infrastructure.Data.Configurations;

public class CvConfiguration : IEntityTypeConfiguration<Cv>
{
    public void Configure(EntityTypeBuilder<Cv> builder)
    {
        builder.Property(c => c.FileName).HasMaxLength(260).IsRequired();
        builder.Property(c => c.ContentType).HasMaxLength(200).IsRequired();
        builder.Property(c => c.StorageKey).HasMaxLength(260).IsRequired();

        builder.HasOne(c => c.Candidate)
            .WithMany(c => c.Cvs)
            .HasForeignKey(c => c.CandidateId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(c => c.CandidateId);
    }
}
