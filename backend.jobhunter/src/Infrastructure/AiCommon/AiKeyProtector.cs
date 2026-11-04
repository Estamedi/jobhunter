using backend.jobhunter.Application.Common.Interfaces;
using Microsoft.AspNetCore.DataProtection;

namespace backend.jobhunter.Infrastructure.AiCommon;

// Uses the same key ring as the bearer tokens, which production keeps on a volume (DataProtection:KeysPath).
public class AiKeyProtector(IDataProtectionProvider provider) : IAiKeyProtector
{
    private readonly IDataProtector _protector = provider.CreateProtector("jobhunter.ai-provider-keys");

    public string Protect(string apiKey) => _protector.Protect(apiKey);

    public bool TryUnprotect(string protectedKey, out string apiKey)
    {
        try
        {
            apiKey = _protector.Unprotect(protectedKey);
            return true;
        }
        catch (Exception)
        {
            apiKey = string.Empty;
            return false;
        }
    }
}
