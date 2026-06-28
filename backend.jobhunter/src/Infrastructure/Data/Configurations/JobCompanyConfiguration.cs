using backend.jobhunter.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace backend.jobhunter.Infrastructure.Data.Configurations;

public class JobCompanyConfiguration : IEntityTypeConfiguration<JobCompany>
{
    public void Configure(EntityTypeBuilder<JobCompany> builder)
    {
        builder.Property(c => c.Name).HasMaxLength(300).IsRequired();
        builder.Property(c => c.Website).HasMaxLength(500);
        builder.Property(c => c.LinkedInUrl).HasMaxLength(500);
        builder.Property(c => c.Country).HasMaxLength(100);
        builder.Property(c => c.City).HasMaxLength(100);
        builder.Property(c => c.Industry).HasMaxLength(100);
        builder.Property(c => c.CompanySize).HasMaxLength(50);
        builder.Property(c => c.Priority).HasMaxLength(50).IsRequired();

        builder.HasIndex(c => c.Name);
    }
}
