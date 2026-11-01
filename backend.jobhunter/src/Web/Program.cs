using backend.jobhunter.Infrastructure.Data;
using Scalar.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.AddServiceDefaults();

builder.AddKeyVaultIfConfigured();
builder.AddApplicationServices();
builder.AddInfrastructureServices();
builder.AddWebServices();

var app = builder.Build();

// Configure the HTTP request pipeline.
await app.InitialiseDatabaseAsync();

app.UseForwardedHeaders();

app.UseExceptionHandler(options => { });

if (!app.Environment.IsDevelopment())
{
    // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
    app.UseHsts();
}

app.UseHttpsRedirection();
app.Use(static async (context, next) =>
{
    var headers = context.Response.Headers;
    headers.XContentTypeOptions = "nosniff";
    headers.XFrameOptions = "DENY";
    headers["Referrer-Policy"] = "no-referrer";
    await next();
});

// Browser clients are restricted to the configured origins (Cors:AllowedOrigins). When none are
// configured every origin is allowed; the API uses bearer tokens, not cookies, so that is not a CSRF risk.
var allowedOrigins = app.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
    ?.Where(static origin => !string.IsNullOrWhiteSpace(origin)).ToArray() ?? [];

app.UseCors(builder =>
{
    builder.AllowAnyMethod().AllowAnyHeader();

    if (allowedOrigins.Length > 0)
    {
        builder.WithOrigins(allowedOrigins);
    }
    else
    {
        builder.AllowAnyOrigin();
    }
});

// Explicit so auth runs after CORS; otherwise 401s lack CORS headers and
// browser clients (the extension) can't see them to refresh their token.
app.UseAuthentication();
app.UseRateLimiter();
app.UseAuthorization();

app.UseFileServer();

// API docs list every route and schema; keep them out of production.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference();
}

if (app.Environment.IsDevelopment())
{
    app.Map("/", () => Results.Redirect("/scalar"));
}

app.MapDefaultEndpoints();
app.MapEndpoints(typeof(Program).Assembly);


app.Run();
