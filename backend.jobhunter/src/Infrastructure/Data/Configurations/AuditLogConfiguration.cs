using backend.jobhunter.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace backend.jobhunter.Infrastructure.Data.Configurations;

public class AuditLogConfiguration : IEntityTypeConfiguration<AuditLog>
{
    public void Configure(EntityTypeBuilder<AuditLog> builder)
    {
        builder.Property(a => a.UserId).HasMaxLength(100);
        builder.Property(a => a.UserEmail).HasMaxLength(256);
        builder.Property(a => a.Action).HasMaxLength(100).IsRequired();
        builder.Property(a => a.Payload).HasMaxLength(4000);
        builder.Property(a => a.Error).HasMaxLength(4000);
        builder.HasIndex(a => a.Timestamp);
        builder.HasIndex(a => a.UserId);
        builder.HasIndex(a => a.Action);
    }
}
