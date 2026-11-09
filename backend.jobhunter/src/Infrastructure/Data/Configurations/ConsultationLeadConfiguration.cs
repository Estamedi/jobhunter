using backend.jobhunter.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace backend.jobhunter.Infrastructure.Data.Configurations;

public class ConsultationLeadConfiguration : IEntityTypeConfiguration<ConsultationLead>
{
    public void Configure(EntityTypeBuilder<ConsultationLead> builder)
    {
        builder.Property(l => l.FullName).HasMaxLength(200).IsRequired();
        builder.Property(l => l.Email).HasMaxLength(256);
        builder.Property(l => l.Phone).HasMaxLength(50).IsRequired();
        builder.Property(l => l.Message).HasMaxLength(2000);
        builder.Property(l => l.Locale).HasMaxLength(10);
        builder.HasIndex(l => l.Created);
    }
}
