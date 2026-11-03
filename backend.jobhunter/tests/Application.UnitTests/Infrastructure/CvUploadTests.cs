using backend.jobhunter.Domain.Entities;
using backend.jobhunter.Domain.Enums;
using backend.jobhunter.Domain.Events;
using backend.jobhunter.Infrastructure.Files;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using NUnit.Framework;
using Shouldly;

namespace backend.jobhunter.Application.UnitTests.Infrastructure;

public class CvUploadTests
{
    private static readonly UploadRetryOptions Retry = new() { BaseDelaySeconds = 10, MaxDelaySeconds = 100 };
    private static readonly DateTimeOffset Now = new(2026, 1, 1, 12, 0, 0, TimeSpan.Zero);

    [Test]
    public void MarkForUpload_WithRemoteSync_QueuesAndRaisesEvent()
    {
        var cv = new Cv();

        cv.MarkForUpload(requiresRemoteSync: true);

        cv.UploadStatus.ShouldBe(CvUploadStatus.Pending);
        cv.DomainEvents.ShouldHaveSingleItem().ShouldBeOfType<CvUploadRequestedEvent>();
    }

    [Test]
    public void MarkForUpload_WithoutRemoteSync_IsUploadedAndRaisesNothing()
    {
        var cv = new Cv();

        cv.MarkForUpload(requiresRemoteSync: false);

        cv.UploadStatus.ShouldBe(CvUploadStatus.Uploaded);
        cv.DomainEvents.ShouldBeEmpty();
    }

    [Test]
    public void IsDue_FirstAttempt_IsImmediate() =>
        CvUploadWorker.IsDue(0, null, Now, Retry).ShouldBeTrue();

    [TestCase(1, 9, false)]
    [TestCase(1, 10, true)]
    [TestCase(2, 19, false)]
    [TestCase(2, 20, true)]
    [TestCase(10, 99, false)] // capped at MaxDelaySeconds
    [TestCase(10, 100, true)]
    public void IsDue_UsesExponentialBackoffWithCap(int attempts, int secondsSinceLast, bool expected) =>
        CvUploadWorker.IsDue(attempts, Now.AddSeconds(-secondsSinceLast), Now, Retry).ShouldBe(expected);

    [Test]
    public async Task Signal_CompletesWhenNotified_AndTimesOutOtherwise()
    {
        var signal = new CvUploadSignal();

        (await signal.WaitAsync(TimeSpan.FromMilliseconds(50), CancellationToken.None)).ShouldBeFalse();

        signal.Notify();
        signal.Notify(); // coalesced
        (await signal.WaitAsync(TimeSpan.FromSeconds(1), CancellationToken.None)).ShouldBeTrue();
        (await signal.WaitAsync(TimeSpan.FromMilliseconds(50), CancellationToken.None)).ShouldBeFalse();
    }

    [Test]
    public async Task CachedStorage_SaveAsync_WritesToDiskOnly()
    {
        var root = Path.Combine(Path.GetTempPath(), "cv-cache-" + Guid.NewGuid().ToString("N"));
        try
        {
            var options = Options.Create(new FileStorageOptions
            {
                RootPath = root,
                S3 = { BucketName = "unit-test-bucket", ServiceUrl = "http://127.0.0.1:1" },
            });
            using var s3 = new S3FileStorage(options);
            var storage = new CachedS3FileStorage(options, s3, NullLogger<CachedS3FileStorage>.Instance);

            storage.RequiresRemoteSync.ShouldBeTrue();

            await using var content = new MemoryStream("%PDF-1.4"u8.ToArray());
            var key = await storage.SaveAsync(content, "cv.pdf", "42", CancellationToken.None);

            key.ShouldStartWith("42/");
            File.Exists(Path.Combine(root, key.Replace('/', Path.DirectorySeparatorChar))).ShouldBeTrue();
        }
        finally
        {
            if (Directory.Exists(root))
            {
                Directory.Delete(root, recursive: true);
            }
        }
    }

    [Test]
    public void StorageKey_New_BuildsFolderedKey()
    {
        var key = StorageKey.New("My CV.PDF", "42");

        key.ShouldMatch(@"^42/[0-9a-f]{32}\.PDF$");
        StorageKey.New("cv.pdf", null).ShouldMatch(@"^[0-9a-f]{32}\.pdf$");
    }

    [TestCase("../x")]
    [TestCase("a/b/c.pdf")]
    [TestCase("a/../c.pdf")]
    [TestCase("/abs.pdf")]
    [TestCase("a\\b.pdf")]
    [TestCase("")]
    public void StorageKey_Validate_RejectsUnsafeKeys(string key) =>
        Should.Throw<InvalidOperationException>(() => StorageKey.Validate(key));

    [TestCase("abc.pdf")]
    [TestCase("42/abc.pdf")]
    public void StorageKey_Validate_AcceptsFlatAndFolderedKeys(string key) =>
        StorageKey.Validate(key).ShouldBe(key);

    [Test]
    public void StorageKey_New_RejectsUnsafeFolder() =>
        Should.Throw<InvalidOperationException>(() => StorageKey.New("cv.pdf", "../x"));

    [TestCase(2, "Jane Sample", "2-jane-sample")]
    [TestCase(7, "  José Álvarez-Ñuñez ", "7-jose-alvarez-nunez")]
    [TestCase(9, "محمد", "9")]
    [TestCase(3, null, "3")]
    [TestCase(4, "../../etc/passwd", "4-etc-passwd")]
    public void CvStorageFolder_BuildsReadableSafeFolder(int id, string? name, string expected) =>
        backend.jobhunter.Application.Cvs.CvStorageFolder.For(id, name).ShouldBe(expected);

    [Test]
    public void CvStorageFolder_IsAlwaysAValidStorageFolder() =>
        StorageKey.New("cv.pdf", backend.jobhunter.Application.Cvs.CvStorageFolder.For(5, new string('a', 200)))
            .ShouldStartWith("5-");
}
