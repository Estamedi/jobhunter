using backend.jobhunter.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace backend.jobhunter.Infrastructure.Data.Configurations;

public class CandidatePhotoConfiguration : IEntityTypeConfiguration<CandidatePhoto>
{
    public void Configure(EntityTypeBuilder<CandidatePhoto> builder)
    {
        builder.Property(p => p.Data).IsRequired();
        builder.Property(p => p.ContentType).HasMaxLength(30).IsRequired();

        builder.HasOne(p => p.Candidate)
            .WithOne(c => c.Photo)
            .HasForeignKey<CandidatePhoto>(p => p.CandidateId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(p => p.CandidateId).IsUnique();
    }
}
