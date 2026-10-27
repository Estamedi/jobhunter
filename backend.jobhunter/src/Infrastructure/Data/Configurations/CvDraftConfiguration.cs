using backend.jobhunter.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace backend.jobhunter.Infrastructure.Data.Configurations;

public class CvDraftConfiguration : IEntityTypeConfiguration<CvDraft>
{
    public void Configure(EntityTypeBuilder<CvDraft> builder)
    {
        builder.Property(d => d.Title).HasMaxLength(200).IsRequired();
        builder.Property(d => d.JobTitle).HasMaxLength(200).IsRequired();
        builder.Property(d => d.JobDescription).HasMaxLength(20000);
        builder.Property(d => d.Instructions).HasMaxLength(4000);
        builder.Property(d => d.Tone).HasMaxLength(50);
        builder.Property(d => d.Language).HasMaxLength(50);
        builder.Property(d => d.LanguageLevel).HasMaxLength(2);
        builder.Property(d => d.TemplateId).HasMaxLength(50).IsRequired();
        builder.Property(d => d.ContentJson).HasColumnType("jsonb").IsRequired();

        builder.HasOne(d => d.Candidate)
            .WithMany(c => c.CvDrafts)
            .HasForeignKey(d => d.CandidateId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(d => d.SourceCv)
            .WithMany()
            .HasForeignKey(d => d.SourceCvId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(d => d.JobApplication)
            .WithMany()
            .HasForeignKey(d => d.JobApplicationId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasIndex(d => d.CandidateId);
        builder.HasIndex(d => d.SourceCvId);
        builder.HasIndex(d => d.JobApplicationId);
    }
}
