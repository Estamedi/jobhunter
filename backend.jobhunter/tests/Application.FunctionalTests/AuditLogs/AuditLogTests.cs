using System.Net.Http.Json;
using backend.jobhunter.Application.AuditLogs.Queries.GetAuditLogs;
using backend.jobhunter.Application.Common.Exceptions;
using backend.jobhunter.Application.Settings.Commands.SetAiProviderKey;
using backend.jobhunter.Domain.Entities;

namespace backend.jobhunter.Application.FunctionalTests.AuditLogs;

public class AuditLogTests : TestBase
{
    private const string SecretKey = "sk-super-secret-abcdefghijklmnop";

    private static async Task<List<AuditLogDto>> LogsAsync()
        => (await TestApp.SendAsync(new GetAuditLogsQuery(PageSize: 100))).Items.ToList();

    [Test]
    public async Task ShouldRefuseANonAdministrator()
    {
        await TestApp.RunAsDefaultUserAsync();

        await Should.ThrowAsync<ForbiddenAccessException>(() => TestApp.SendAsync(new GetAuditLogsQuery()));
    }

    [Test]
    public async Task ShouldRecordACommandWithoutItsSecret()
    {
        await TestApp.RunAsAdministratorAsync();

        await TestApp.SendAsync(new SetAiProviderKeyCommand("OpenAI", SecretKey));

        var row = (await LogsAsync()).Single(l => l.Action == "SetAiProviderKey");
        row.Succeeded.ShouldBeTrue();
        row.UserEmail.ShouldBe("administrator@local");
        row.Payload.ShouldNotBeNull().ShouldNotContain(SecretKey);
        row.Payload.ShouldContain("OpenAI");
    }

    [Test]
    public async Task ShouldRecordWhyACommandFailed()
    {
        await TestApp.RunAsDefaultUserAsync();
        await Should.ThrowAsync<ForbiddenAccessException>(() => TestApp.SendAsync(new SetAiProviderKeyCommand("OpenAI", SecretKey)));

        await TestApp.RunAsAdministratorAsync();
        var row = (await LogsAsync()).Single(l => l.Action == "SetAiProviderKey");

        row.Succeeded.ShouldBeFalse();
        row.UserEmail.ShouldBe("test@local");
        row.Error.ShouldNotBeNull().ShouldContain("ForbiddenAccessException");
    }

    [Test]
    public async Task ShouldNotRecordQueries()
    {
        await TestApp.RunAsAdministratorAsync();

        await LogsAsync();

        (await TestApp.CountAsync<AuditLog>()).ShouldBe(0);
    }

    [Test]
    public async Task ShouldRecordAFailedSignIn()
    {
        await TestApp.RunAsAdministratorAsync();
        using var client = FunctionalTestSetup.Factory.CreateClient();

        var response = await client.PostAsJsonAsync("/api/Users/login?useCookies=false",
            new { email = "nobody@local", password = "wrong-password-123" });

        response.IsSuccessStatusCode.ShouldBeFalse();
        var row = (await LogsAsync()).Single(l => l.Action == "Login");
        row.Succeeded.ShouldBeFalse();
        row.UserEmail.ShouldBe("nobody@local");
        row.Payload.ShouldNotBeNull().ShouldNotContain("wrong-password");
    }
}
