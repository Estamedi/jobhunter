namespace backend.jobhunter.Application.Common.Interfaces;

public interface IFileStorage
{
    // True when files must be copied to remote storage after SaveAsync (handled by a background worker).
    bool RequiresRemoteSync { get; }

    // folder groups related files under one key prefix (e.g. a candidate id); null stores at the root.
    Task<string> SaveAsync(Stream content, string fileName, string? folder, CancellationToken cancellationToken);
    Task<Stream> OpenReadAsync(string storageKey, CancellationToken cancellationToken);
    Task DeleteAsync(string storageKey, CancellationToken cancellationToken);
}
