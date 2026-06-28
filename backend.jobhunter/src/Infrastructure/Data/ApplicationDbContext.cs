using System.Reflection;
using backend.jobhunter.Application.Common.Interfaces;
using backend.jobhunter.Domain.Entities;
using backend.jobhunter.Infrastructure.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace backend.jobhunter.Infrastructure.Data;

public class ApplicationDbContext : IdentityDbContext<ApplicationUser>, IApplicationDbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options) { }

    public DbSet<TodoList> TodoLists => Set<TodoList>();
    public DbSet<TodoItem> TodoItems => Set<TodoItem>();

    public DbSet<Candidate> Candidates => Set<Candidate>();
    public DbSet<JobCompany> Companies => Set<JobCompany>();
    public DbSet<JobContact> Contacts => Set<JobContact>();
    public DbSet<JobRole> JobRoles => Set<JobRole>();
    public DbSet<JobApplication> Applications => Set<JobApplication>();
    public DbSet<JobActivity> Activities => Set<JobActivity>();
    public DbSet<JobInterview> Interviews => Set<JobInterview>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);
        builder.ApplyConfigurationsFromAssembly(Assembly.GetExecutingAssembly());
    }
}
