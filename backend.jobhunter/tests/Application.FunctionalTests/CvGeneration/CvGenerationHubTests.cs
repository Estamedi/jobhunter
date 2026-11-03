using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using backend.jobhunter.Application.CvDrafts.Commands.GenerateCvDraft;
using backend.jobhunter.Domain.Entities;
using backend.jobhunter.Infrastructure.Data;
using backend.jobhunter.Infrastructure.Identity;
using Microsoft.AspNetCore.Http.Connections;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.SignalR.Client;
using Microsoft.Extensions.DependencyInjection;

namespace backend.jobhunter.Application.FunctionalTests.CvGeneration;

// The live-update hub with the real authentication: the token goes in the query string like a browser's
// WebSocket, and a draft finishing is pushed to its owner only. Long polling stands in for the socket here
// because it is also what a browser falls back to behind a proxy that does not forward WebSockets.
public class CvGenerationHubTests : TestBase
{
    private const string Email = "hub-user@local";
    private const string Password = "Testing1234!";

    [SetUp]
    public void ResetFakes()
    {
        FakeCvAi.Reset();
        lock (CapturingNotifier.Sent) CapturingNotifier.Sent.Clear();
    }

    private static async Task<string> SignInAsync(string email = Email)
    {
        if (TestApp.GetUserId() is null) await TestApp.RunAsUserAsync(email, Password, []);

        using (var scope = FunctionalTestSetup.ScopeFactory.CreateScope())
        {
            // Sign-in needs a confirmed address.
            var users = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
            var user = (await users.FindByIdAsync(TestApp.GetUserId()!))!;
            user.EmailConfirmed = true;
            await users.UpdateAsync(user);
        }

        using var client = FunctionalTestSetup.Factory.CreateClient();
        var login = await client.PostAsJsonAsync("/api/Users/login", new { email = Email, password = Password });
        login.EnsureSuccessStatusCode();
        var body = await login.Content.ReadFromJsonAsync<JsonElement>();
        return body.GetProperty("accessToken").GetString()!;
    }

    private static HubConnection Connect(string? token)
        => new HubConnectionBuilder()
            .WithUrl(new Uri(FunctionalTestSetup.Factory.Server.BaseAddress, "hubs/cv-generation"), options =>
            {
                options.HttpMessageHandlerFactory = _ => FunctionalTestSetup.Factory.Server.CreateHandler();
                options.Transports = HttpTransportType.LongPolling;
                options.AccessTokenProvider = () => Task.FromResult(token);
            })
            .Build();

    private static async Task<int> CreateCandidateAsync()
    {
        using var scope = FunctionalTestSetup.ScopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var candidate = new Candidate { FullName = "Jane Sample", Email = "jane@example.com" };
        db.Candidates.Add(candidate);
        await db.SaveChangesAsync();
        return candidate.Id;
    }

    [Test]
    public async Task ShouldPushTheFinishedDraftToItsOwnerOverTheHub()
    {
        var token = await SignInAsync();
        var candidateId = await CreateCandidateAsync();
        var pushed = new TaskCompletionSource<JsonElement>();
        await using var connection = Connect(token);
        connection.On<JsonElement>("CvDraftChanged", e => pushed.TrySetResult(e));
        await connection.StartAsync();

        var created = await TestApp.SendAsync(new GenerateCvDraftCommand
        {
            CandidateId = candidateId, JobTitle = "DevOps Engineer", JobDescription = "Terraform.",
        });

        var message = await pushed.Task.WaitAsync(TimeSpan.FromSeconds(30));
        message.GetProperty("draftId").GetInt32().ShouldBe(created.Id);
        message.GetProperty("status").GetString().ShouldBe("Completed");
    }

    [Test]
    public async Task ShouldNotPushADraftToAnotherUser()
    {
        var token = await SignInAsync();
        var received = new List<JsonElement>();
        await using var connection = Connect(token);
        connection.On<JsonElement>("CvDraftChanged", e => { lock (received) received.Add(e); });
        await connection.StartAsync();

        // A draft owned by someone else finishes: the worker tells that owner, not the connected user.
        using (var scope = FunctionalTestSetup.ScopeFactory.CreateScope())
        {
            var notifier = scope.ServiceProvider.GetRequiredService<backend.jobhunter.Application.Common.Interfaces.ICvGenerationNotifier>();
            await notifier.NotifyAsync(Guid.NewGuid().ToString(), 999, "Completed", default);
        }
        await Task.Delay(1500);

        lock (received) received.ShouldBeEmpty();
    }

    [Test]
    public async Task ShouldRefuseAConnectionWithoutAValidToken()
    {
        await using var connection = Connect(token: null);
        var noToken = await Should.ThrowAsync<HttpRequestException>(() => connection.StartAsync());
        noToken.StatusCode.ShouldBe(HttpStatusCode.Unauthorized);

        await using var wrong = Connect(token: "not-a-real-token");
        var badToken = await Should.ThrowAsync<HttpRequestException>(() => wrong.StartAsync());
        badToken.StatusCode.ShouldBe(HttpStatusCode.Unauthorized);
    }
}
