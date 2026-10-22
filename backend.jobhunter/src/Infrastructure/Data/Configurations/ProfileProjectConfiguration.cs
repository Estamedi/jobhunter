using backend.jobhunter.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace backend.jobhunter.Infrastructure.Data.Configurations;

public class ProfileProjectConfiguration : IEntityTypeConfiguration<ProfileProject>
{
    public void Configure(EntityTypeBuilder<ProfileProject> builder)
    {
        builder.Property(p => p.Name).HasMaxLength(200).IsRequired();
        builder.Property(p => p.Description).HasMaxLength(2000);
        builder.Property(p => p.Url).HasMaxLength(500);

        builder.HasOne(p => p.Profile)
            .WithMany(x => x.Projects)
            .HasForeignKey(p => p.ProfileId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(p => p.ProfileId);
    }
}
