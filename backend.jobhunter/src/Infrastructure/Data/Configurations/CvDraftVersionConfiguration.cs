using backend.jobhunter.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace backend.jobhunter.Infrastructure.Data.Configurations;

public class CvDraftVersionConfiguration : IEntityTypeConfiguration<CvDraftVersion>
{
    public void Configure(EntityTypeBuilder<CvDraftVersion> builder)
    {
        builder.Property(v => v.ContentJson).HasColumnType("jsonb").IsRequired();
        builder.Property(v => v.Reason).HasMaxLength(100).IsRequired();

        builder.HasOne(v => v.CvDraft)
            .WithMany(d => d.Versions)
            .HasForeignKey(v => v.CvDraftId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(v => v.CvDraftId);
    }
}
