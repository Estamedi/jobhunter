namespace backend.jobhunter.Infrastructure.Files;

public class FileStorageOptions
{
    // "S3" (default) or "Local".
    public string Provider { get; set; } = "S3";

    public string RootPath { get; set; } = "App_Data/uploads";

    public S3StorageOptions S3 { get; set; } = new();

    public UploadRetryOptions Retry { get; set; } = new();
}

public class UploadRetryOptions
{
    // Fallback poll interval; the worker is also woken immediately by a domain event.
    public int PollSeconds { get; set; } = 30;

    public int MaxAttempts { get; set; } = 8;

    // Delay before attempt n+1 is BaseDelaySeconds * 2^(n-1), capped at MaxDelaySeconds.
    public int BaseDelaySeconds { get; set; } = 15;
    public int MaxDelaySeconds { get; set; } = 1800;

    public int BatchSize { get; set; } = 20;
}

public class S3StorageOptions
{
    public string BucketName { get; set; } = string.Empty;

    // AWS region system name, e.g. "eu-central-1".
    public string Region { get; set; } = "eu-central-1";

    // Fail fast instead of hanging when S3 is unreachable.
    public int ClientTimeoutSeconds { get; set; } = 10;
    public int MaxErrorRetry { get; set; } = 1;

    // Optional key prefix inside the bucket, e.g. "cvs/". Not part of the stored key.
    public string KeyPrefix { get; set; } = "cvs/";

    // Optional. When empty the default AWS credential chain is used (env vars, profile, IAM role).
    public string AccessKeyId { get; set; } = string.Empty;
    public string SecretAccessKey { get; set; } = string.Empty;

    // Optional, for S3-compatible endpoints (MinIO, LocalStack).
    public string ServiceUrl { get; set; } = string.Empty;
}
