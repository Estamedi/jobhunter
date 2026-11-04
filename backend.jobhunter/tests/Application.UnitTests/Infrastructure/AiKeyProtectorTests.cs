using backend.jobhunter.Application.Settings.Commands.SetAiProviderKey;
using backend.jobhunter.Infrastructure.AiCommon;
using Microsoft.AspNetCore.DataProtection;
using NUnit.Framework;
using Shouldly;

namespace backend.jobhunter.Application.UnitTests.Infrastructure;

public class AiKeyProtectorTests
{
    [Test]
    public void ShouldReadBackWhatItProtectedWithoutKeepingTheKeyInTheResult()
    {
        var protector = new AiKeyProtector(new EphemeralDataProtectionProvider());

        var stored = protector.Protect("sk-secret-1234");

        stored.ShouldNotContain("secret");
        protector.TryUnprotect(stored, out var plain).ShouldBeTrue();
        plain.ShouldBe("sk-secret-1234");
    }

    [Test]
    public void ShouldReportAValueItCannotReadInsteadOfThrowing()
    {
        var protector = new AiKeyProtector(new EphemeralDataProtectionProvider());

        protector.TryUnprotect("garbage", out var plain).ShouldBeFalse();
        plain.ShouldBeEmpty();
    }

    [Test]
    public void ShouldNotReadAKeyProtectedWithAnotherKeyRing()
    {
        var stored = new AiKeyProtector(new EphemeralDataProtectionProvider()).Protect("sk-secret-1234");

        new AiKeyProtector(new EphemeralDataProtectionProvider()).TryUnprotect(stored, out _).ShouldBeFalse();
    }

    [Test]
    public void ShouldNeverPrintTheKeyWhenTheCommandIsLogged()
    {
        var command = new SetAiProviderKeyCommand("OpenAI", "sk-secret-1234");

        var text = command.ToString();

        text.ShouldNotContain("sk-secret-1234");
        text.ShouldContain("OpenAI");
        $"{command}".ShouldNotContain("secret");
    }
}
