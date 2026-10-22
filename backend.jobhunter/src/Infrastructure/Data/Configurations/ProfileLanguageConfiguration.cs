using backend.jobhunter.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace backend.jobhunter.Infrastructure.Data.Configurations;

public class ProfileLanguageConfiguration : IEntityTypeConfiguration<ProfileLanguage>
{
    public void Configure(EntityTypeBuilder<ProfileLanguage> builder)
    {
        builder.Property(l => l.Name).HasMaxLength(100).IsRequired();
        builder.Property(l => l.Proficiency).HasConversion<string>().HasMaxLength(30);

        builder.HasOne(l => l.Profile)
            .WithMany(p => p.Languages)
            .HasForeignKey(l => l.ProfileId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(l => l.ProfileId);
    }
}
