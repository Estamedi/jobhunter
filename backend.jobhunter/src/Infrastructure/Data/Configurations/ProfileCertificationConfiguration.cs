using backend.jobhunter.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace backend.jobhunter.Infrastructure.Data.Configurations;

public class ProfileCertificationConfiguration : IEntityTypeConfiguration<ProfileCertification>
{
    public void Configure(EntityTypeBuilder<ProfileCertification> builder)
    {
        builder.Property(c => c.Name).HasMaxLength(200).IsRequired();
        builder.Property(c => c.Issuer).HasMaxLength(200);
        builder.Property(c => c.CredentialUrl).HasMaxLength(500);

        builder.HasOne(c => c.Profile)
            .WithMany(p => p.Certifications)
            .HasForeignKey(c => c.ProfileId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(c => c.ProfileId);
    }
}
