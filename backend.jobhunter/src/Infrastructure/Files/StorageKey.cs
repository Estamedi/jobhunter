using System.Text.RegularExpressions;

namespace backend.jobhunter.Infrastructure.Files;

// A storage key is "<guid>.<ext>" (legacy, flat) or "<folder>/<guid>.<ext>" (e.g. "42/<guid>.pdf").
// The same relative key is used for the local cache path and, after the configured prefix, the S3 object key.
public static partial class StorageKey
{
    public static string New(string fileName, string? folder)
    {
        var extension = Path.GetExtension(fileName);
        if (!ExtensionPattern().IsMatch(extension))
        {
            extension = string.Empty;
        }

        var name = $"{Guid.NewGuid():N}{extension}";
        if (string.IsNullOrEmpty(folder))
        {
            return name;
        }

        if (!FolderPattern().IsMatch(folder))
        {
            throw new InvalidOperationException("Invalid storage folder.");
        }

        return $"{folder}/{name}";
    }

    // Returns the key unchanged if it is a safe relative key (at most one folder, no traversal).
    public static string Validate(string storageKey)
    {
        if (string.IsNullOrEmpty(storageKey))
        {
            throw new InvalidOperationException("Invalid storage key.");
        }

        var segments = storageKey.Split('/');
        if (segments.Length > 2 || segments.Any(s => s.Length == 0 || s is "." or ".." || s != Path.GetFileName(s) || s.Contains('\\')))
        {
            throw new InvalidOperationException("Invalid storage key.");
        }

        return storageKey;
    }

    // Absolute path of the key under root, creating the folder when asked.
    public static string ToPath(string root, string storageKey, bool createFolder = false)
    {
        var path = Path.Combine(root, Validate(storageKey).Replace('/', Path.DirectorySeparatorChar));
        if (createFolder)
        {
            Directory.CreateDirectory(Path.GetDirectoryName(path)!);
        }

        return path;
    }

    [GeneratedRegex(@"^\.[A-Za-z0-9]{1,10}$")]
    private static partial Regex ExtensionPattern();

    [GeneratedRegex(@"^[A-Za-z0-9_-]{1,64}$")]
    private static partial Regex FolderPattern();
}
