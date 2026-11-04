namespace backend.jobhunter.Application.Common.Interfaces;

/// <summary>Encrypts the AI provider API keys an administrator saves, so the database never holds one in plain text.</summary>
public interface IAiKeyProtector
{
    string Protect(string apiKey);

    /// <summary>False when the value cannot be read, for example after the encryption keys were lost. Never throws.</summary>
    bool TryUnprotect(string protectedKey, out string apiKey);
}
