using backend.jobhunter.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace backend.jobhunter.Infrastructure.Data.Configurations;

public class NoteConfiguration : IEntityTypeConfiguration<Note>
{
    public void Configure(EntityTypeBuilder<Note> builder)
    {
        builder.Property(n => n.Content).HasMaxLength(4000).IsRequired();

        builder.HasOne(n => n.Application)
            .WithMany(a => a.NoteEntries)
            .HasForeignKey(n => n.ApplicationId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasIndex(n => n.ApplicationId);
    }
}
