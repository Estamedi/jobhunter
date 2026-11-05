using backend.jobhunter.Application.CandidateProfiles;
using backend.jobhunter.Application.Common;
using backend.jobhunter.Application.Common.Interfaces;
using backend.jobhunter.Application.CvDrafts;
using backend.jobhunter.Infrastructure.AiCommon;
using backend.jobhunter.Infrastructure.AiCvGeneration;
using backend.jobhunter.Infrastructure.AiProfileImport;
using backend.jobhunter.Infrastructure.AiExtraction;
using backend.jobhunter.Infrastructure.CvGeneration;
using backend.jobhunter.Infrastructure.CvImport;
using backend.jobhunter.Infrastructure.ProfileImport;
using backend.jobhunter.Infrastructure.CvRendering;
using backend.jobhunter.Infrastructure.Data;
using backend.jobhunter.Infrastructure.Data.Interceptors;
using backend.jobhunter.Infrastructure.Files;
using backend.jobhunter.Infrastructure.Identity;
using backend.jobhunter.Infrastructure.Notification;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Microsoft.Extensions.DependencyInjection;

public static class DependencyInjection
{
    public static void AddInfrastructureServices(this IHostApplicationBuilder builder)
    {
        var connectionString = builder.Configuration.GetConnectionString(Services.Database);
        Guard.Against.Null(connectionString, message: $"Connection string '{Services.Database}' not found.");

        builder.Services.AddScoped<ISaveChangesInterceptor, AuditableEntityInterceptor>();
        builder.Services.AddScoped<ISaveChangesInterceptor, DispatchDomainEventsInterceptor>();

        builder.Services.AddDbContext<ApplicationDbContext>((sp, options) =>
        {
            options.AddInterceptors(sp.GetServices<ISaveChangesInterceptor>());
            options.UseNpgsql(connectionString);
            options.ConfigureWarnings(warnings => warnings.Ignore(RelationalEventId.PendingModelChangesWarning));
        });

        builder.EnrichNpgsqlDbContext<ApplicationDbContext>();

        builder.Services.AddScoped<IApplicationDbContext>(provider => provider.GetRequiredService<ApplicationDbContext>());

        builder.Services.AddScoped<ApplicationDbContextInitialiser>();

        builder.Services.AddAuthentication()
            .AddBearerToken(IdentityConstants.BearerScheme, options =>
            {
                // The UI keeps the access token in a 7-day cookie and has no refresh flow, so the
                // token must live as long as the cookie or users are signed out after the default hour.
                options.BearerTokenExpiration = TimeSpan.FromDays(7);
                options.RefreshTokenExpiration = TimeSpan.FromDays(14);

                // Browsers cannot set headers on a WebSocket, so the live-update hub sends the token in the query string.
                options.Events.OnMessageReceived = context =>
                {
                    var token = context.Request.Query["access_token"];
                    if (!string.IsNullOrEmpty(token) && context.HttpContext.Request.Path.StartsWithSegments("/hubs"))
                    {
                        context.Token = token;
                    }
                    return Task.CompletedTask;
                };
            });

        builder.Services.AddAuthorizationBuilder();

        builder.Services
            .AddIdentityCore<ApplicationUser>(options =>
            {
                // Password sign-in must prove ownership of the address; otherwise an unconfirmed
                // account could be used to squat an email before its real owner signs up.
                options.SignIn.RequireConfirmedEmail = true;

                options.Password.RequiredLength = 10;

                options.Lockout.AllowedForNewUsers = true;
                options.Lockout.MaxFailedAccessAttempts = 5;
                options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(15);
            })
            .AddRoles<IdentityRole>()
            .AddUserManager<ApplicationUserManager>()
            .AddEntityFrameworkStores<ApplicationDbContext>()
            .AddApiEndpoints();

        builder.Services.AddSingleton(TimeProvider.System);
        builder.Services.AddTransient<IIdentityService, IdentityService>();

        builder.Services.Configure<EmailSettings>(builder.Configuration.GetSection("EmailSender"));
        builder.Services.AddSingleton<EmailService>();
        builder.Services.AddSingleton<EmailQueue>();
        builder.Services.AddSingleton<IEmailQueue>(sp => sp.GetRequiredService<EmailQueue>());
        builder.Services.AddSingleton<IEmailNotificationService, EventEmailNotificationService>();
        builder.Services.AddTransient<EmailWorker>();
        builder.Services.AddTransient<IEmailSender<ApplicationUser>, IdentityEmailSender>();

        builder.Services.Configure<FileStorageOptions>(builder.Configuration.GetSection("FileStorage"));
        if (string.Equals(builder.Configuration["FileStorage:Provider"], "Local", StringComparison.OrdinalIgnoreCase))
        {
            builder.Services.AddSingleton<IFileStorage, LocalFileStorage>();
            builder.Services.AddSingleton<ICvUploadSignal, NoopCvUploadSignal>();
        }
        else
        {
            builder.Services.AddSingleton<S3FileStorage>();
            builder.Services.AddSingleton<CachedS3FileStorage>();
            builder.Services.AddSingleton<IFileStorage>(sp => sp.GetRequiredService<CachedS3FileStorage>());
            builder.Services.AddSingleton<ICvRemoteSync>(sp => sp.GetRequiredService<CachedS3FileStorage>());
            builder.Services.AddSingleton<ICvUploadSignal, CvUploadSignal>();
            builder.Services.AddTransient<CvUploadWorker>();
        }

        builder.Services.AddSingleton<ICvGenerationSignal, CvGenerationSignal>();
        builder.Services.AddScoped<UserOverride>();
        builder.Services.AddScoped<CvDraftGenerationService>();
        builder.Services.AddTransient<CvGenerationWorker>();

        builder.Services.AddSingleton<IProfileImportSignal, ProfileImportSignal>();
        builder.Services.AddScoped<ProfileImportService>();
        builder.Services.AddTransient<ProfileImportWorker>();

        builder.AddBackgroundJobs(connectionString);

        builder.Services.Configure<AiExtractionOptions>(builder.Configuration.GetSection("AiExtraction"));
        builder.Services.AddTransient<IJobExtractionAiService, AiJobExtractionService>();
        builder.Services.Configure<LangfuseOptions>(builder.Configuration.GetSection("Langfuse"));
        builder.Services.PostConfigure<LangfuseOptions>(o => o.Environment = builder.Environment.EnvironmentName.ToLowerInvariant());
        builder.Services.AddSingleton<LangfuseTelemetry>();
        builder.Services.AddSingleton<IAiProviderCatalog, AiProviderCatalog>();
        builder.Services.AddSingleton<IAiKeyProtector, AiKeyProtector>();
        builder.Services.AddMemoryCache();
        builder.Services.AddScoped<IAiModelCatalog, AiModelCatalog>();
        builder.Services.AddTransient<AiJsonClient>();
        builder.Services.AddTransient<ICvGenerationAiService, AiCvGenerationService>();
        builder.Services.AddTransient<IProfileImportAiService, AiProfileImportService>();
        builder.Services.AddSingleton<ICvTextExtractor, CvTextExtractor>();
        builder.Services.AddSingleton<ICvPdfRenderer, QuestPdfCvRenderer>();
        builder.Services.AddSingleton<ICvDocxRenderer, DocxCvRenderer>();
    }
}
