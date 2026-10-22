using backend.jobhunter.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace backend.jobhunter.Infrastructure.Data.Configurations;

public class ProfileEducationConfiguration : IEntityTypeConfiguration<ProfileEducation>
{
    public void Configure(EntityTypeBuilder<ProfileEducation> builder)
    {
        builder.Property(e => e.Institution).HasMaxLength(200).IsRequired();
        builder.Property(e => e.Degree).HasMaxLength(200).IsRequired();
        builder.Property(e => e.FieldOfStudy).HasMaxLength(200);
        builder.Property(e => e.Location).HasMaxLength(200);
        builder.Property(e => e.Details).HasMaxLength(2000);

        builder.HasOne(e => e.Profile)
            .WithMany(p => p.Educations)
            .HasForeignKey(e => e.ProfileId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(e => e.ProfileId);
    }
}
