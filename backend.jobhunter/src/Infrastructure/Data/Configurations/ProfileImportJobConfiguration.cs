using backend.jobhunter.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace backend.jobhunter.Infrastructure.Data.Configurations;

public class ProfileImportJobConfiguration : IEntityTypeConfiguration<ProfileImportJob>
{
    public void Configure(EntityTypeBuilder<ProfileImportJob> builder)
    {
        builder.Property(j => j.Status).HasConversion<string>().HasMaxLength(20);
        builder.Property(j => j.ResultJson).HasColumnType("jsonb");
        builder.Property(j => j.Error).HasMaxLength(500);

        // One job per CV, which is what makes starting an import twice safe.
        builder.HasOne(j => j.Cv)
            .WithOne(c => c.ImportJob)
            .HasForeignKey<ProfileImportJob>(j => j.CvId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(j => j.CvId).IsUnique();
        builder.HasIndex(j => j.Status);
    }
}
