using backend.jobhunter.Domain.Entities;
using backend.jobhunter.Domain.Enums;
using backend.jobhunter.Infrastructure.Data;
using backend.jobhunter.Infrastructure.Files;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

namespace backend.jobhunter.Application.FunctionalTests.Cvs;

public class CvUploadWorkerTests : TestBase
{
    private sealed class FakeRemote : ICvRemoteSync
    {
        public Func<string, Task<RemoteSyncResult>> OnSync { get; set; } = _ => Task.FromResult(RemoteSyncResult.Uploaded);
        public List<string> Synced { get; } = [];
        public List<string> Deleted { get; } = [];

        public async Task<RemoteSyncResult> SyncToRemoteAsync(string storageKey, CancellationToken cancellationToken)
        {
            Synced.Add(storageKey);
            return await OnSync(storageKey);
        }

        public Task DeleteRemoteAsync(string storageKey, CancellationToken cancellationToken)
        {
            Deleted.Add(storageKey);
            return Task.CompletedTask;
        }
    }

    private static CvUploadWorker CreateWorker(FakeRemote remote, int maxAttempts = 2) => new(
        FunctionalTestSetup.ScopeFactory,
        FunctionalTestSetup.ScopeFactory.CreateScope().ServiceProvider,
        new CvUploadSignal(),
        Options.Create(new FileStorageOptions
        {
            Retry = { MaxAttempts = maxAttempts, BaseDelaySeconds = 0, MaxDelaySeconds = 0 },
        }),
        TimeProvider.System,
        NullLogger<CvUploadWorker>.Instance,
        remote);

    private static async Task<int> AddPendingCvAsync(string storageKey = "1/abc.pdf")
    {
        await TestApp.RunAsDefaultUserAsync();

        using var scope = FunctionalTestSetup.ScopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var cv = new Cv
        {
            Candidate = new Candidate { FullName = "Jane Sample", Email = "jane@example.com" },
            FileName = "cv.pdf",
            ContentType = "application/pdf",
            FileSizeBytes = 8,
            StorageKey = storageKey,
        };
        cv.MarkForUpload(requiresRemoteSync: true);
        db.Cvs.Add(cv);
        await db.SaveChangesAsync();
        return cv.Id;
    }

    private static async Task<Cv> LoadAsync(int id)
    {
        using var scope = FunctionalTestSetup.ScopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        return await db.Cvs.IgnoreQueryFilters().AsNoTracking().SingleAsync(c => c.Id == id);
    }

    [Test]
    public async Task ShouldMarkAPendingCvUploadedAfterASuccessfulSync()
    {
        var id = await AddPendingCvAsync();
        var remote = new FakeRemote();

        await CreateWorker(remote).ProcessPendingAsync(new(), CancellationToken.None);

        var cv = await LoadAsync(id);
        cv.UploadStatus.ShouldBe(CvUploadStatus.Uploaded);
        cv.LastUploadError.ShouldBeNull();
        remote.Synced.ShouldBe(["1/abc.pdf"]);
    }

    [Test]
    public async Task ShouldKeepRetryingThenFailAfterMaxAttempts()
    {
        var id = await AddPendingCvAsync();
        var remote = new FakeRemote { OnSync = _ => throw new IOException("S3 down") };
        var worker = CreateWorker(remote, maxAttempts: 2);

        await worker.ProcessPendingAsync(new() { MaxAttempts = 2, BaseDelaySeconds = 0, MaxDelaySeconds = 0 }, CancellationToken.None);
        var afterFirst = await LoadAsync(id);
        afterFirst.UploadStatus.ShouldBe(CvUploadStatus.Pending);
        afterFirst.UploadAttempts.ShouldBe(1);
        afterFirst.LastUploadError.ShouldBe("S3 down");

        await worker.ProcessPendingAsync(new() { MaxAttempts = 2, BaseDelaySeconds = 0, MaxDelaySeconds = 0 }, CancellationToken.None);
        var afterSecond = await LoadAsync(id);
        afterSecond.UploadStatus.ShouldBe(CvUploadStatus.Failed);
        afterSecond.UploadAttempts.ShouldBe(2);

        // Failed rows are not picked up again.
        await worker.ProcessPendingAsync(new() { MaxAttempts = 2, BaseDelaySeconds = 0, MaxDelaySeconds = 0 }, CancellationToken.None);
        remote.Synced.Count.ShouldBe(2);
    }

    [Test]
    public async Task ShouldMarkTheCvFailedWhenTheFileIsMissingEverywhere()
    {
        var id = await AddPendingCvAsync();
        var remote = new FakeRemote { OnSync = _ => Task.FromResult(RemoteSyncResult.Missing) };

        await CreateWorker(remote).ProcessPendingAsync(new(), CancellationToken.None);

        var cv = await LoadAsync(id);
        cv.UploadStatus.ShouldBe(CvUploadStatus.Failed);
        cv.LastUploadError.ShouldNotBeNullOrEmpty();
    }

    [Test]
    public async Task ShouldDeleteTheRemoteObjectWhenTheCvIsDeletedMidUpload()
    {
        var id = await AddPendingCvAsync();
        var remote = new FakeRemote();
        remote.OnSync = async _ =>
        {
            using var scope = FunctionalTestSetup.ScopeFactory.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            await db.Cvs.IgnoreQueryFilters().Where(c => c.Id == id).ExecuteDeleteAsync();
            return RemoteSyncResult.Uploaded;
        };

        await CreateWorker(remote).ProcessPendingAsync(new(), CancellationToken.None);

        remote.Deleted.ShouldBe(["1/abc.pdf"]);
    }
}
