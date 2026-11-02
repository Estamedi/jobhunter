using Amazon.S3;
using backend.jobhunter.Application.Common.Interfaces;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace backend.jobhunter.Infrastructure.Files;

// S3 is the source of truth; the local disk (FileStorage:RootPath, a persistent volume on the VPS)
// is a read-through cache. Reads hit disk first and fall back to S3, filling the cache on a miss.
// S3 problems never block the user: a failed upload keeps the file on disk and is logged.
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

    public async Task<string> SaveAsync(Stream content, string fileName, CancellationToken cancellationToken)
    {
        var storageKey = S3FileStorage.NewStorageKey(fileName);
        var cacheFile = ResolvePath(storageKey);

        await using (var fileStream = File.Create(cacheFile))
        {
            await content.CopyToAsync(fileStream, cancellationToken);
        }

        try
        {
            await using var upload = File.OpenRead(cacheFile);
            await _s3.PutAsync(storageKey, upload, cancellationToken);
        }
        catch (Exception ex) when (ex is not OperationCanceledException || !cancellationToken.IsCancellationRequested)
        {
            // Keep the cached copy so the user can still use the file; it is served from disk.
            _logger.LogWarning(ex, "S3 upload failed for {StorageKey}; file kept on local disk only.", storageKey);
        }

        return storageKey;
    }

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

    private string ResolvePath(string storageKey)
    {
        if (string.IsNullOrEmpty(storageKey) || storageKey != Path.GetFileName(storageKey))
        {
            throw new InvalidOperationException("Invalid storage key.");
        }

        return Path.Combine(_cachePath, storageKey);
    }

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
