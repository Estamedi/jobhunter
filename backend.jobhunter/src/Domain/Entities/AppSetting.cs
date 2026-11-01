namespace backend.jobhunter.Domain.Entities;

/// <summary>Admin-editable key/value settings that override server config (e.g. the AI provider).</summary>
public class AppSetting
{
    public string Key { get; set; } = string.Empty;
    public string Value { get; set; } = string.Empty;
}
