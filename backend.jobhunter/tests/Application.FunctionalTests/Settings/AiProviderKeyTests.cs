using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using backend.jobhunter.Application.Common.Exceptions;
using backend.jobhunter.Application.Common.Interfaces;
using backend.jobhunter.Application.Settings.Commands.RemoveAiProviderKey;
using backend.jobhunter.Application.Settings.Commands.SetAiProviderKey;
using backend.jobhunter.Application.Settings.Commands.UpdateAiActions;
using backend.jobhunter.Application.Settings.Commands.UpdateAiProvider;
using backend.jobhunter.Application.Settings.Queries.GetAiSettings;
using backend.jobhunter.Domain.Constants;
using backend.jobhunter.Domain.Entities;
using backend.jobhunter.Infrastructure.AiCommon;
using backend.jobhunter.Infrastructure.Data;
using backend.jobhunter.Infrastructure.Identity;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using ValidationException = backend.jobhunter.Application.Common.Exceptions.ValidationException;

namespace backend.jobhunter.Application.FunctionalTests.Settings;

public class AiProviderKeyTests : TestBase
{
    private record Answer(string Text);

    private const string SavedKey = "sk-saved-abcdefghijklmnop-1234";

    [SetUp]
    public void ResetFakes() => FakeAiHttp.Reset();

    private static async Task<AiProviderStatusDto> StatusAsync(string provider)
        => (await TestApp.SendAsync(new GetAiSettingsQuery())).Providers.Single(p => p.Name == provider);

    private static async Task<string?> StoredValueAsync(string provider)
        => (await TestApp.FindAsync<AppSetting>(AiSettingKeys.ApiKey(provider)))?.Value;

    private static async Task<Answer> AskAsync()
    {
        using var scope = FunctionalTestSetup.ScopeFactory.CreateScope();
        var client = scope.ServiceProvider.GetRequiredService<AiJsonClient>();
        return await client.CompleteAsync<Answer>("rules", "prompt", """{"type":"object"}""", "test", 100, null, null, default);
    }

    [Test]
    public async Task ShouldRefuseANonAdministrator()
    {
        await TestApp.RunAsDefaultUserAsync();

        await Should.ThrowAsync<ForbiddenAccessException>(
            () => TestApp.SendAsync(new SetAiProviderKeyCommand("OpenAI", SavedKey)));
        await Should.ThrowAsync<ForbiddenAccessException>(
            () => TestApp.SendAsync(new RemoveAiProviderKeyCommand("OpenAI")));
        (await StoredValueAsync("OpenAI")).ShouldBeNull();
    }

    [Test]
    public async Task ShouldSaveAKeyEncryptedAndShowOnlyWhereItComesFromAndItsLastFourCharacters()
    {
        await TestApp.RunAsAdministratorAsync();

        await TestApp.SendAsync(new SetAiProviderKeyCommand("OpenAI", $"  {SavedKey}  "));

        var stored = await StoredValueAsync("OpenAI");
        stored.ShouldNotBeNull();
        stored.ShouldNotContain(SavedKey);
        using (var scope = FunctionalTestSetup.ScopeFactory.CreateScope())
        {
            scope.ServiceProvider.GetRequiredService<IAiKeyProtector>().TryUnprotect(stored, out var plain).ShouldBeTrue();
            plain.ShouldBe(SavedKey);
        }

        var settings = await TestApp.SendAsync(new GetAiSettingsQuery());
        var status = settings.Providers.Single(p => p.Name == "OpenAI");
        status.Configured.ShouldBeTrue();
        status.Source.ShouldBe("settings");
        status.Hint.ShouldBe("1234");
        status.SavedKeyUnreadable.ShouldBeFalse();
        JsonSerializer.Serialize(settings).ShouldNotContain("abcdefghijklmnop");
    }

    [Test]
    public async Task ShouldKeepEachProvidersKeySeparate()
    {
        await TestApp.RunAsAdministratorAsync();

        await TestApp.SendAsync(new SetAiProviderKeyCommand("OpenAI", "sk-openai-key-AAAA"));
        await TestApp.SendAsync(new SetAiProviderKeyCommand("Anthropic", "sk-ant-key-BBBB"));
        await TestApp.SendAsync(new RemoveAiProviderKeyCommand("OpenAI"));

        (await StoredValueAsync("OpenAI")).ShouldBeNull();
        (await StoredValueAsync("Anthropic")).ShouldNotBeNull();
        (await StatusAsync("Anthropic")).Hint.ShouldBe("BBBB");
    }

    [Test]
    public async Task ShouldReplaceTheSavedKeyWhenSavedAgain()
    {
        await TestApp.RunAsAdministratorAsync();
        await TestApp.SendAsync(new SetAiProviderKeyCommand("OpenAI", "sk-first-1111"));

        await TestApp.SendAsync(new SetAiProviderKeyCommand("OpenAI", "sk-second-2222"));

        (await StatusAsync("OpenAI")).Hint.ShouldBe("2222");
        (await TestApp.CountAsync<AppSetting>()).ShouldBe(1);
    }

    [Test]
    public async Task ShouldGoBackToWhateverTheServerConfigHasWhenTheSavedKeyIsRemoved()
    {
        await TestApp.RunAsAdministratorAsync();
        var before = await StatusAsync("OpenAI");

        await TestApp.SendAsync(new SetAiProviderKeyCommand("OpenAI", SavedKey));
        await TestApp.SendAsync(new RemoveAiProviderKeyCommand("OpenAI"));

        var after = await StatusAsync("OpenAI");
        after.Configured.ShouldBe(before.Configured);
        after.Source.ShouldBe(before.Source);
        after.Hint.ShouldBeNull();
    }

    [Test]
    public async Task ShouldNotFailWhenRemovingAKeyThatWasNeverSaved()
    {
        await TestApp.RunAsAdministratorAsync();

        await TestApp.SendAsync(new RemoveAiProviderKeyCommand("OpenAI"));
    }

    [TestCase("Nope", "sk-ok-1234")]
    [TestCase("OpenAI", "")]
    [TestCase("OpenAI", "   ")]
    [TestCase("OpenAI", "sk-has space")]
    [TestCase("OpenAI", "sk-has\nbreak")]
    public async Task ShouldRefuseAnUnknownProviderOrAKeyThatCouldBreakTheRequest(string provider, string key)
    {
        await TestApp.RunAsAdministratorAsync();

        await Should.ThrowAsync<ValidationException>(() => TestApp.SendAsync(new SetAiProviderKeyCommand(provider, key)));
        (await TestApp.CountAsync<AppSetting>()).ShouldBe(0);
    }

    [Test]
    public async Task ShouldAcceptTheLongestKeyAndRefuseOneThatIsLonger()
    {
        await TestApp.RunAsAdministratorAsync();
        var longest = "sk-" + new string('x', SetAiProviderKeyCommandValidator.MaxKeyLength - 3);

        await TestApp.SendAsync(new SetAiProviderKeyCommand("OpenAI", longest));

        (await StoredValueAsync("OpenAI"))!.Length.ShouldBeLessThan(500);
        await Should.ThrowAsync<ValidationException>(
            () => TestApp.SendAsync(new SetAiProviderKeyCommand("OpenAI", longest + "y")));
    }

    [Test]
    public async Task ShouldKeepTheSavedKeyWhenTheActionChoicesAreSaved()
    {
        await TestApp.RunAsAdministratorAsync();
        await TestApp.SendAsync(new SetAiProviderKeyCommand("OpenAI", SavedKey));

        await TestApp.SendAsync(new UpdateAiActionsCommand([new AiActionChoice(AiActions.All[0].Key, null, null)]));
        await TestApp.SendAsync(new UpdateAiProviderCommand("OpenAI"));

        (await StatusAsync("OpenAI")).Hint.ShouldBe("1234");
    }

    [Test]
    public async Task ShouldSendTheSavedKeyToTheProviderWithoutAnyKeyInServerConfig()
    {
        await TestApp.RunAsAdministratorAsync();
        await TestApp.SendAsync(new UpdateAiProviderCommand("Anthropic"));
        await TestApp.SendAsync(new SetAiProviderKeyCommand("Anthropic", SavedKey));

        (await AskAsync()).Text.ShouldBe("ok");

        var sent = FakeAiHttp.Requests.First();
        sent.Host.ShouldBe("api.anthropic.com");
        sent.ApiKeyHeader.ShouldBe(SavedKey);
    }

    [Test]
    public async Task ShouldUseTheSavedKeyInsteadOfTheConfigKeyForThatProvider()
    {
        await TestApp.RunAsAdministratorAsync();
        await TestApp.SendAsync(new UpdateAiProviderCommand("OpenAI"));
        await TestApp.SendAsync(new SetAiProviderKeyCommand("OpenAI", SavedKey));

        await AskAsync();

        var sent = FakeAiHttp.Requests.First();
        sent.Host.ShouldBe("api.openai.com");
        sent.Authorization.ShouldBe($"Bearer {SavedKey}");
    }

    [Test]
    public async Task ShouldNotBreakACallWhenTheSavedKeyCanNoLongerBeRead()
    {
        await TestApp.RunAsAdministratorAsync();
        await TestApp.SendAsync(new UpdateAiProviderCommand("OpenAI"));
        await TestApp.AddAsync(new AppSetting { Key = AiSettingKeys.ApiKey("OpenAI"), Value = "not-a-protected-value" });

        var status = await StatusAsync("OpenAI");
        status.SavedKeyUnreadable.ShouldBeTrue();
        status.Source.ShouldNotBe("settings");
        status.Hint.ShouldBeNull();

        // With no other key the call says AI is not set up; with a config key it carries on with that one.
        // Either way the broken value is skipped and nothing else goes wrong.
        try
        {
            await AskAsync();
            FakeAiHttp.Requests.ShouldNotContain(r => r.Authorization == "Bearer not-a-protected-value");
        }
        catch (AiServiceException ex)
        {
            ex.Failure.ShouldBe(AiFailure.NotConfigured);
        }
    }

    private static async Task<HttpClient> SignedInClientAsync(string email, string password)
    {
        using (var scope = FunctionalTestSetup.ScopeFactory.CreateScope())
        {
            // Signing in needs a confirmed email address.
            var users = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
            var user = (await users.FindByIdAsync(TestApp.GetUserId()!))!;
            user.EmailConfirmed = true;
            await users.UpdateAsync(user);
        }

        var client = FunctionalTestSetup.Factory.CreateClient();
        var login = await client.PostAsJsonAsync("/api/Users/login", new { email, password });
        login.EnsureSuccessStatusCode();
        var token = (await login.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("accessToken").GetString()!;
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        return client;
    }

    [Test]
    public async Task ShouldSaveShowAndRemoveAKeyThroughTheRoutesThePageCalls()
    {
        await TestApp.RunAsAdministratorAsync();
        using var client = await SignedInClientAsync("administrator@local", "Administrator1234!");

        var save = await client.PutAsJsonAsync("/api/Settings/ai/keys/OpenAI", new { apiKey = SavedKey });
        save.StatusCode.ShouldBe(HttpStatusCode.NoContent);

        var read = await client.GetStringAsync("/api/Settings/ai");
        read.ShouldNotContain("abcdefghijklmnop");
        var openAi = JsonDocument.Parse(read).RootElement.GetProperty("providers").EnumerateArray()
            .Single(p => p.GetProperty("name").GetString() == "OpenAI");
        openAi.GetProperty("configured").GetBoolean().ShouldBeTrue();
        openAi.GetProperty("source").GetString().ShouldBe("settings");
        openAi.GetProperty("hint").GetString().ShouldBe("1234");
        openAi.GetProperty("savedKeyUnreadable").GetBoolean().ShouldBeFalse();

        var refused = await client.PutAsJsonAsync("/api/Settings/ai/keys/OpenAI", new { apiKey = "sk-has space-9999" });
        refused.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
        var body = await refused.Content.ReadAsStringAsync();
        body.ShouldContain("must not contain spaces");
        body.ShouldNotContain("sk-has");
        (await StatusAsync("OpenAI")).Hint.ShouldBe("1234");

        var remove = await client.DeleteAsync("/api/Settings/ai/keys/OpenAI");
        remove.StatusCode.ShouldBe(HttpStatusCode.NoContent);
        (await StoredValueAsync("OpenAI")).ShouldBeNull();
    }

    [Test]
    public async Task ShouldRefuseANormalUserOnTheRoutes()
    {
        await TestApp.RunAsDefaultUserAsync();
        using var client = await SignedInClientAsync("test@local", "Testing1234!");

        (await client.PutAsJsonAsync("/api/Settings/ai/keys/OpenAI", new { apiKey = SavedKey })).StatusCode
            .ShouldBe(HttpStatusCode.Forbidden);
        (await client.DeleteAsync("/api/Settings/ai/keys/OpenAI")).StatusCode.ShouldBe(HttpStatusCode.Forbidden);
        (await StoredValueAsync("OpenAI")).ShouldBeNull();
    }

    [Test]
    public async Task ShouldRefuseAnUnknownProviderOnTheRoute()
    {
        await TestApp.RunAsAdministratorAsync();
        using var client = await SignedInClientAsync("administrator@local", "Administrator1234!");

        (await client.PutAsJsonAsync("/api/Settings/ai/keys/Nope", new { apiKey = SavedKey })).StatusCode
            .ShouldBe(HttpStatusCode.BadRequest);
    }
}
