using backend.jobhunter.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace backend.jobhunter.Infrastructure.Data.Configurations;

public class JobTitleConfiguration : IEntityTypeConfiguration<JobTitle>
{
    public void Configure(EntityTypeBuilder<JobTitle> builder)
    {
        builder.Property(t => t.Name).HasMaxLength(300).IsRequired();

        builder.HasIndex(t => t.Name);
    }
}
