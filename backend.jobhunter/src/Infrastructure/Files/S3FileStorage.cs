using System.Net;
using Amazon;
using Amazon.S3;
using Amazon.S3.Model;
using backend.jobhunter.Application.Common.Interfaces;
using Microsoft.Extensions.Options;

namespace backend.jobhunter.Infrastructure.Files;

public class S3FileStorage : IFileStorage, IDisposable
{
    private readonly IAmazonS3 _client;
    private readonly string _bucket;
    private readonly string _prefix;

    public S3FileStorage(IOptions<FileStorageOptions> options)
    {
        var s3 = options.Value.S3;
        if (string.IsNullOrWhiteSpace(s3.BucketName))
        {
            throw new InvalidOperationException("FileStorage:S3:BucketName is required when FileStorage:Provider is S3.");
        }

        _bucket = s3.BucketName;
        _prefix = s3.KeyPrefix ?? string.Empty;

        var config = new AmazonS3Config
        {
            Timeout = TimeSpan.FromSeconds(s3.ClientTimeoutSeconds),
            MaxErrorRetry = s3.MaxErrorRetry,
        };
        if (!string.IsNullOrWhiteSpace(s3.ServiceUrl))
        {
            config.ServiceURL = s3.ServiceUrl;
            config.ForcePathStyle = true;
        }
        else if (!string.IsNullOrWhiteSpace(s3.Region))
        {
            config.RegionEndpoint = RegionEndpoint.GetBySystemName(s3.Region);
        }

        _client = !string.IsNullOrWhiteSpace(s3.AccessKeyId) && !string.IsNullOrWhiteSpace(s3.SecretAccessKey)
            ? new AmazonS3Client(s3.AccessKeyId, s3.SecretAccessKey, config)
            : new AmazonS3Client(config);
    }

    public bool RequiresRemoteSync => false;

    public async Task<string> SaveAsync(Stream content, string fileName, string? folder, CancellationToken cancellationToken)
    {
        var storageKey = StorageKey.New(fileName, folder);
        await PutAsync(storageKey, content, cancellationToken);
        return storageKey;
    }

    public async Task PutAsync(string storageKey, Stream content, CancellationToken cancellationToken)
    {
        // PutObject needs a seekable stream to know the length.
        var body = content;
        MemoryStream? buffer = null;
        if (!content.CanSeek)
        {
            buffer = new MemoryStream();
            await content.CopyToAsync(buffer, cancellationToken);
            buffer.Position = 0;
            body = buffer;
        }

        try
        {
            await _client.PutObjectAsync(new PutObjectRequest
            {
                BucketName = _bucket,
                Key = _prefix + ValidateKey(storageKey),
                InputStream = body,
                ContentType = ContentTypeFor(Path.GetExtension(storageKey)),
                ServerSideEncryptionMethod = ServerSideEncryptionMethod.AES256,
            }, cancellationToken);
        }
        finally
        {
            buffer?.Dispose();
        }
    }

    public async Task<bool> ExistsAsync(string storageKey, CancellationToken cancellationToken)
    {
        try
        {
            await _client.GetObjectMetadataAsync(_bucket, _prefix + ValidateKey(storageKey), cancellationToken);
            return true;
        }
        catch (AmazonS3Exception ex) when (ex.StatusCode == HttpStatusCode.NotFound)
        {
            return false;
        }
    }

    public async Task<Stream> OpenReadAsync(string storageKey, CancellationToken cancellationToken)
    {
        var response = await _client.GetObjectAsync(_bucket, _prefix + ValidateKey(storageKey), cancellationToken);
        return response.ResponseStream;
    }

    public async Task DeleteAsync(string storageKey, CancellationToken cancellationToken)
    {
        // S3 delete is idempotent: a missing key is not an error.
        await _client.DeleteObjectAsync(_bucket, _prefix + ValidateKey(storageKey), cancellationToken);
    }

    public void Dispose() => _client.Dispose();

    private static string ValidateKey(string storageKey) => StorageKey.Validate(storageKey);

    private static string ContentTypeFor(string extension) => extension.ToLowerInvariant() switch
    {
        ".pdf" => "application/pdf",
        ".docx" => "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ".doc" => "application/msword",
        _ => "application/octet-stream",
    };
}
