using backend.jobhunter.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace backend.jobhunter.Infrastructure.Data.Configurations;

public class ProfileLinkConfiguration : IEntityTypeConfiguration<ProfileLink>
{
    public void Configure(EntityTypeBuilder<ProfileLink> builder)
    {
        builder.Property(l => l.Label).HasMaxLength(100).IsRequired();
        builder.Property(l => l.Url).HasMaxLength(500).IsRequired();

        builder.HasOne(l => l.Profile)
            .WithMany(p => p.Links)
            .HasForeignKey(l => l.ProfileId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(l => l.ProfileId);
    }
}
