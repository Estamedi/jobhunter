using System.Reflection;
using backend.jobhunter.Application.Common.Interfaces;
using backend.jobhunter.Domain.Common;
using backend.jobhunter.Domain.Entities;
using backend.jobhunter.Infrastructure.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

namespace backend.jobhunter.Infrastructure.Data;

public class ApplicationDbContext : IdentityDbContext<ApplicationUser>, IApplicationDbContext
{
    private readonly IUser _user;

    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options, IUser user) : base(options)
    {
        _user = user;
    }

    public DbSet<Candidate> Candidates => Set<Candidate>();
    public DbSet<JobCompany> Companies => Set<JobCompany>();
    public DbSet<JobContact> Contacts => Set<JobContact>();
    public DbSet<JobRole> JobRoles => Set<JobRole>();
    public DbSet<JobApplication> Applications => Set<JobApplication>();
    public DbSet<JobActivity> Activities => Set<JobActivity>();
    public DbSet<JobInterview> Interviews => Set<JobInterview>();
    public DbSet<Cv> Cvs => Set<Cv>();
    public DbSet<Note> Notes => Set<Note>();

    private Guid? CurrentOwnerId => Guid.TryParse(_user.Id, out var id) ? id : null;

    protected override void ConfigureConventions(ModelConfigurationBuilder configurationBuilder)
    {
        base.ConfigureConventions(configurationBuilder);

        // Npgsql only accepts UTC (offset 0) for 'timestamp with time zone'; normalize any
        // client-supplied offset (e.g. a user's local timezone) before it hits the database.
        configurationBuilder.Properties<DateTimeOffset>()
            .HaveConversion<DateTimeOffsetUtcConverter>();
    }

    private class DateTimeOffsetUtcConverter()
        : ValueConverter<DateTimeOffset, DateTimeOffset>(v => v.ToUniversalTime(), v => v);

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);
        builder.ApplyConfigurationsFromAssembly(Assembly.GetExecutingAssembly());

        foreach (var entityType in builder.Model.GetEntityTypes())
        {
            if (entityType.IsOwned() || entityType.ClrType is null || !typeof(OwnedEntity).IsAssignableFrom(entityType.ClrType))
            {
                continue;
            }

            ApplyOwnedEntityQueryFilterMethod.MakeGenericMethod(entityType.ClrType).Invoke(this, [builder]);
        }
    }

    private static readonly MethodInfo ApplyOwnedEntityQueryFilterMethod =
        typeof(ApplicationDbContext).GetMethod(nameof(ApplyOwnedEntityQueryFilter), BindingFlags.NonPublic | BindingFlags.Instance)!;

    private void ApplyOwnedEntityQueryFilter<TEntity>(ModelBuilder builder) where TEntity : OwnedEntity
    {
        builder.Entity<TEntity>().HasQueryFilter(e => e.OwnerId == CurrentOwnerId);
    }
}
