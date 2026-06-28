using backend.jobhunter.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace backend.jobhunter.Infrastructure.Data.Configurations;

public class JobContactConfiguration : IEntityTypeConfiguration<JobContact>
{
    public void Configure(EntityTypeBuilder<JobContact> builder)
    {
        builder.Property(c => c.FullName).HasMaxLength(200).IsRequired();
        builder.Property(c => c.JobTitle).HasMaxLength(200);
        builder.Property(c => c.Email).HasMaxLength(200);
        builder.Property(c => c.Phone).HasMaxLength(50);
        builder.Property(c => c.LinkedInUrl).HasMaxLength(500);
        builder.Property(c => c.Type).HasMaxLength(50).IsRequired();
        builder.Property(c => c.Warmth).HasMaxLength(50).IsRequired();

        builder.HasOne(c => c.Company)
            .WithMany(co => co.Contacts)
            .HasForeignKey(c => c.CompanyId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(c => c.CompanyId);
    }
}
