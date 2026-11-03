using backend.jobhunter.Application.Common.Interfaces;
using Microsoft.Extensions.Options;

namespace backend.jobhunter.Infrastructure.Files;

public class LocalFileStorage : IFileStorage
{
    private readonly string _rootPath;

    public bool RequiresRemoteSync => false;

    public LocalFileStorage(IOptions<FileStorageOptions> options)
    {
        _rootPath = Path.GetFullPath(options.Value.RootPath);
        Directory.CreateDirectory(_rootPath);
    }

    public async Task<string> SaveAsync(Stream content, string fileName, string? folder, CancellationToken cancellationToken)
    {
        var storageKey = StorageKey.New(fileName, folder);
        var fullPath = StorageKey.ToPath(_rootPath, storageKey, createFolder: true);

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

    private string ResolvePath(string storageKey) => StorageKey.ToPath(_rootPath, storageKey);
}
