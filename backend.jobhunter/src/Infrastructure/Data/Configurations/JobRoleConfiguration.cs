using backend.jobhunter.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace backend.jobhunter.Infrastructure.Data.Configurations;

public class JobRoleConfiguration : IEntityTypeConfiguration<JobRole>
{
    public void Configure(EntityTypeBuilder<JobRole> builder)
    {
        builder.Property(r => r.Title).HasMaxLength(300).IsRequired();
        builder.Property(r => r.JobLink).HasMaxLength(1000);
        builder.Property(r => r.Source).HasMaxLength(50).IsRequired();
        builder.Property(r => r.Country).HasMaxLength(100);
        builder.Property(r => r.City).HasMaxLength(100);
        builder.Property(r => r.WorkType).HasMaxLength(50).IsRequired();
        builder.Property(r => r.Currency).HasMaxLength(10);
        builder.Property(r => r.EmploymentType).HasMaxLength(50).IsRequired();
        builder.Property(r => r.RoleStatus).HasMaxLength(50).IsRequired();
        builder.Property(r => r.SalaryMin).HasPrecision(18, 2);
        builder.Property(r => r.SalaryMax).HasPrecision(18, 2);

        builder.HasOne(r => r.Company)
            .WithMany(c => c.JobRoles)
            .HasForeignKey(r => r.CompanyId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(r => r.JobTitle)
            .WithMany(t => t.JobRoles)
            .HasForeignKey(r => r.JobTitleId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasIndex(r => r.CompanyId);
        builder.HasIndex(r => r.RoleStatus);
        builder.HasIndex(r => r.JobTitleId);
    }
}
