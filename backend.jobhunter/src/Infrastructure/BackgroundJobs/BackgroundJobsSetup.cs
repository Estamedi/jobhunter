using backend.jobhunter.Application.Common.Behaviours;
using backend.jobhunter.Application.Common.Interfaces;
using backend.jobhunter.Infrastructure.BackgroundJobs;
using Hangfire;
using Hangfire.PostgreSql;
using Microsoft.Extensions.Hosting;

namespace Microsoft.Extensions.DependencyInjection;

public static class BackgroundJobsSetup
{
    // Hangfire keeps its jobs in the "hangfire" schema of the app's own PostgreSQL database and runs them in
    // this process. The administrator's Workers panel reads them through the monitoring API.
    public static void AddBackgroundJobs(this IHostApplicationBuilder builder, string connectionString)
    {
        builder.Services.AddHangfire((sp, config) => config
            .SetDataCompatibilityLevel(CompatibilityLevel.Version_180)
            .UseSimpleAssemblyNameTypeSerializer()
            .UseRecommendedSerializerSettings()
            .UsePostgreSqlStorage(
                o => o.UseNpgsqlConnection(connectionString),
                new PostgreSqlStorageOptions { SchemaName = "hangfire", QueuePollInterval = TimeSpan.FromSeconds(1) })
            .UseFilter(new AuditJobFilter(sp.GetRequiredService<AuditLogWriter>())));

        builder.Services.AddHangfireServer(options =>
        {
            options.ServerName = $"{Environment.MachineName}:{Environment.ProcessId}";
            options.Queues = JobQueues.All;
            options.WorkerCount = 8;
            options.ShutdownTimeout = TimeSpan.FromSeconds(30);
        });

        builder.Services.AddSingleton<JobEnqueuer>();
        builder.Services.AddSingleton<IBackgroundJobMonitor, HangfireJobMonitor>();
        builder.Services.AddHostedService<BackgroundJobsStartup>();
    }
}
