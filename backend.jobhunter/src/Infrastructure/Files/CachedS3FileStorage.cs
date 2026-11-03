using Amazon.S3;
using backend.jobhunter.Application.Common.Interfaces;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace backend.jobhunter.Infrastructure.Files;

// S3 is the source of truth; the local disk (FileStorage:RootPath, a persistent volume on the VPS)
// is a read-through cache. Reads hit disk first and fall back to S3, filling the cache on a miss.
// Uploads are asynchronous: SaveAsync writes to disk only and CvUploadWorker pushes the file to S3.
public class CachedS3FileStorage : IFileStorage
{
    private readonly string _cachePath;
    private readonly S3FileStorage _s3;
    private readonly ILogger<CachedS3FileStorage> _logger;

    public CachedS3FileStorage(IOptions<FileStorageOptions> options, S3FileStorage s3, ILogger<CachedS3FileStorage> logger)
    {
        _s3 = s3;
        _logger = logger;
        _cachePath = Path.GetFullPath(options.Value.RootPath);
        Directory.CreateDirectory(_cachePath);
    }

    public bool RequiresRemoteSync => true;

    // Disk only: the request never waits on S3. CvUploadWorker copies the file to S3 afterwards.
    public async Task<string> SaveAsync(Stream content, string fileName, string? folder, CancellationToken cancellationToken)
    {
        var storageKey = StorageKey.New(fileName, folder);
        var cacheFile = StorageKey.ToPath(_cachePath, storageKey, createFolder: true);

        await using var fileStream = File.Create(cacheFile);
        await content.CopyToAsync(fileStream, cancellationToken);

        return storageKey;
    }

    // Copies the cached file to S3. If the cache file is gone, S3 may already hold it
    // (e.g. the upload succeeded but the status update did not).
    public async Task<RemoteSyncResult> SyncToRemoteAsync(string storageKey, CancellationToken cancellationToken)
    {
        var cacheFile = ResolvePath(storageKey);
        if (File.Exists(cacheFile))
        {
            await using var upload = File.OpenRead(cacheFile);
            await _s3.PutAsync(storageKey, upload, cancellationToken);
            return RemoteSyncResult.Uploaded;
        }

        return await _s3.ExistsAsync(storageKey, cancellationToken)
            ? RemoteSyncResult.Uploaded
            : RemoteSyncResult.Missing;
    }

    public Task DeleteRemoteAsync(string storageKey, CancellationToken cancellationToken) =>
        _s3.DeleteAsync(storageKey, cancellationToken);

    public async Task<Stream> OpenReadAsync(string storageKey, CancellationToken cancellationToken)
    {
        var cacheFile = ResolvePath(storageKey);
        if (File.Exists(cacheFile))
        {
            return File.OpenRead(cacheFile);
        }

        Stream remote;
        try
        {
            remote = await _s3.OpenReadAsync(storageKey, cancellationToken);
        }
        catch (AmazonS3Exception ex) when (ex.ErrorCode is "NoSuchKey" or "NotFound")
        {
            throw new FileNotFoundException("File not found in cache or S3.", storageKey, ex);
        }
        catch (Exception ex) when (ex is not OperationCanceledException || !cancellationToken.IsCancellationRequested)
        {
            _logger.LogWarning(ex, "S3 unavailable while reading {StorageKey}.", storageKey);
            throw new FileNotFoundException("File is not on local disk and S3 is unavailable.", storageKey, ex);
        }

        // Download to a temp file, then move into place so a half-written file is never served.
        StorageKey.ToPath(_cachePath, storageKey, createFolder: true);
        var tempFile = $"{cacheFile}.{Guid.NewGuid():N}.tmp";
        try
        {
            await using (remote)
            await using (var temp = File.Create(tempFile))
            {
                await remote.CopyToAsync(temp, cancellationToken);
            }

            File.Move(tempFile, cacheFile, overwrite: true);
        }
        catch
        {
            TryDelete(tempFile);
            throw;
        }

        return File.OpenRead(cacheFile);
    }

    public async Task DeleteAsync(string storageKey, CancellationToken cancellationToken)
    {
        try
        {
            await _s3.DeleteAsync(storageKey, cancellationToken);
        }
        catch (Exception ex) when (ex is not OperationCanceledException || !cancellationToken.IsCancellationRequested)
        {
            _logger.LogWarning(ex, "S3 delete failed for {StorageKey}; removing the local copy only.", storageKey);
        }

        TryDelete(ResolvePath(storageKey));
    }

    private string ResolvePath(string storageKey) => StorageKey.ToPath(_cachePath, storageKey);

    private static void TryDelete(string path)
    {
        try
        {
            File.Delete(path);
        }
        catch (IOException)
        {
        }
    }
}

public enum RemoteSyncResult
{
    Uploaded,
    Missing,
}
