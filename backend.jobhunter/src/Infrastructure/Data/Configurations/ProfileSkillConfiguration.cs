using backend.jobhunter.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace backend.jobhunter.Infrastructure.Data.Configurations;

public class ProfileSkillConfiguration : IEntityTypeConfiguration<ProfileSkill>
{
    public void Configure(EntityTypeBuilder<ProfileSkill> builder)
    {
        builder.Property(s => s.Name).HasMaxLength(100).IsRequired();
        builder.Property(s => s.Category).HasMaxLength(100);
        builder.Property(s => s.EvidenceLevel).HasConversion<string>().HasMaxLength(30);
        builder.Property(s => s.Note).HasMaxLength(300);

        builder.HasOne(s => s.Profile)
            .WithMany(p => p.Skills)
            .HasForeignKey(s => s.ProfileId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(s => s.ProfileId);
    }
}
