using System.Text.RegularExpressions;
using backend.jobhunter.Application.Common.Interfaces;
using Microsoft.Extensions.Options;

namespace backend.jobhunter.Infrastructure.Files;

public partial class LocalFileStorage : IFileStorage
{
    private readonly string _rootPath;

    public LocalFileStorage(IOptions<FileStorageOptions> options)
    {
        _rootPath = Path.GetFullPath(options.Value.RootPath);
        Directory.CreateDirectory(_rootPath);
    }

    public async Task<string> SaveAsync(Stream content, string fileName, CancellationToken cancellationToken)
    {
        var extension = Path.GetExtension(fileName);
        if (!ExtensionPattern().IsMatch(extension))
        {
            extension = string.Empty;
        }

        var storageKey = $"{Guid.NewGuid():N}{extension}";
        var fullPath = Path.Combine(_rootPath, storageKey);

        await using var fileStream = File.Create(fullPath);
        await content.CopyToAsync(fileStream, cancellationToken);

        return storageKey;
    }

    public Task<Stream> OpenReadAsync(string storageKey, CancellationToken cancellationToken)
    {
        Stream stream = File.OpenRead(ResolvePath(storageKey));
        return Task.FromResult(stream);
    }

    public Task DeleteAsync(string storageKey, CancellationToken cancellationToken)
    {
        var fullPath = ResolvePath(storageKey);
        if (File.Exists(fullPath))
        {
            File.Delete(fullPath);
        }

        return Task.CompletedTask;
    }

    private string ResolvePath(string storageKey)
    {
        if (string.IsNullOrEmpty(storageKey) || storageKey != Path.GetFileName(storageKey))
        {
            throw new InvalidOperationException("Invalid storage key.");
        }

        return Path.Combine(_rootPath, storageKey);
    }

    [GeneratedRegex(@"^\.[A-Za-z0-9]{1,10}$")]
    private static partial Regex ExtensionPattern();
}
