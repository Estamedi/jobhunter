using backend.jobhunter.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace backend.jobhunter.Infrastructure.Data.Configurations;

public class ProfileExperienceConfiguration : IEntityTypeConfiguration<ProfileExperience>
{
    public void Configure(EntityTypeBuilder<ProfileExperience> builder)
    {
        builder.Property(e => e.Title).HasMaxLength(200).IsRequired();
        builder.Property(e => e.Company).HasMaxLength(200).IsRequired();
        builder.Property(e => e.Location).HasMaxLength(200);
        builder.Property(e => e.Description).HasMaxLength(2000);
        builder.Property(e => e.EmploymentType).HasConversion<string>().HasMaxLength(30);
        builder.Property(e => e.WorkplaceType).HasConversion<string>().HasMaxLength(30);
        builder.Property(e => e.Skills).HasColumnType("text[]");

        builder.HasOne(e => e.Profile)
            .WithMany(p => p.Experiences)
            .HasForeignKey(e => e.ProfileId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(e => e.ProfileId);
    }
}
