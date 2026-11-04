using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using backend.jobhunter.Application.CandidateProfiles.Commands.DeleteCandidatePhoto;
using backend.jobhunter.Application.CandidateProfiles.Commands.SaveCandidatePhoto;
using backend.jobhunter.Application.CandidateProfiles.Queries.GetCandidatePhoto;
using backend.jobhunter.Domain.Entities;
using backend.jobhunter.Infrastructure.Data;
using backend.jobhunter.Infrastructure.Identity;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using ValidationException = backend.jobhunter.Application.Common.Exceptions.ValidationException;

namespace backend.jobhunter.Application.FunctionalTests.CandidateProfiles;

public class CandidatePhotoTests : TestBase
{
    // Only the first bytes matter to the server: it reads the type from them.
    private static byte[] Jpeg(int length = 200) => [0xFF, 0xD8, 0xFF, 0xE0, .. new byte[length]];
    private static byte[] Png(int length = 200) => [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, .. new byte[length]];

    private static async Task<int> CreateCandidateForCurrentUserAsync()
    {
        using var scope = FunctionalTestSetup.ScopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var candidate = new Candidate { FullName = "Jane Sample", Email = "jane@example.com" };
        db.Candidates.Add(candidate);
        await db.SaveChangesAsync();
        return candidate.Id;
    }

    private static async Task<int> CandidateAsync()
    {
        if (TestApp.GetUserId() is null) await TestApp.RunAsDefaultUserAsync();
        return await CreateCandidateForCurrentUserAsync();
    }

    private static async Task<int> PhotoRowsAsync(int candidateId)
    {
        using var scope = FunctionalTestSetup.ScopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        return await db.CandidatePhotos.IgnoreQueryFilters().CountAsync(p => p.CandidateId == candidateId);
    }

    [Test]
    public async Task ShouldKeepAJpegOrPngAndTakeTheTypeFromTheBytes()
    {
        var candidateId = await CandidateAsync();

        await TestApp.SendAsync(new SaveCandidatePhotoCommand(candidateId, Jpeg()));
        (await TestApp.SendAsync(new GetCandidatePhotoQuery(candidateId))).ContentType.ShouldBe("image/jpeg");

        await TestApp.SendAsync(new SaveCandidatePhotoCommand(candidateId, Png()));
        var photo = await TestApp.SendAsync(new GetCandidatePhotoQuery(candidateId));
        photo.ContentType.ShouldBe("image/png");
        photo.Data.Length.ShouldBe(208);
        (await PhotoRowsAsync(candidateId)).ShouldBe(1, "a new photo replaces the old one");
    }

    [Test]
    public async Task ShouldRejectAFileThatIsNotAJpegOrPng()
    {
        var candidateId = await CandidateAsync();
        byte[] pdf = [0x25, 0x50, 0x44, 0x46, 0x2D, .. new byte[100]];
        byte[] gif = [0x47, 0x49, 0x46, 0x38, 0x39, 0x61, .. new byte[100]];

        foreach (var bytes in new[] { pdf, gif, new byte[] { 1, 2 } })
        {
            var ex = await Should.ThrowAsync<ValidationException>(() => TestApp.SendAsync(new SaveCandidatePhotoCommand(candidateId, bytes)));
            ex.Errors.Values.SelectMany(v => v).ShouldContain(m => m.Contains("JPEG or PNG"));
        }
        (await PhotoRowsAsync(candidateId)).ShouldBe(0);
    }

    [Test]
    public async Task ShouldRejectAnEmptyOrTooLargePhoto()
    {
        var candidateId = await CandidateAsync();

        await Should.ThrowAsync<ValidationException>(() => TestApp.SendAsync(new SaveCandidatePhotoCommand(candidateId, [])));
        await Should.ThrowAsync<ValidationException>(() =>
            TestApp.SendAsync(new SaveCandidatePhotoCommand(candidateId, Jpeg(2 * 1024 * 1024))));
        await TestApp.SendAsync(new SaveCandidatePhotoCommand(candidateId, Jpeg(2 * 1024 * 1024 - 100)));
    }

    [Test]
    public async Task ShouldRemoveThePhoto()
    {
        var candidateId = await CandidateAsync();
        await TestApp.SendAsync(new SaveCandidatePhotoCommand(candidateId, Png()));

        await TestApp.SendAsync(new DeleteCandidatePhotoCommand(candidateId));

        await Should.ThrowAsync<NotFoundException>(() => TestApp.SendAsync(new GetCandidatePhotoQuery(candidateId)));
        await TestApp.SendAsync(new DeleteCandidatePhotoCommand(candidateId)); // removing nothing is fine
    }

    [Test]
    public async Task ShouldNotLetAnotherUserSeeChangeOrRemoveThePhoto()
    {
        var candidateId = await CandidateAsync();
        await TestApp.SendAsync(new SaveCandidatePhotoCommand(candidateId, Png()));

        await TestApp.RunAsUserAsync("other-user@local", "Testing1234!", []);

        await Should.ThrowAsync<NotFoundException>(() => TestApp.SendAsync(new GetCandidatePhotoQuery(candidateId)));
        await Should.ThrowAsync<NotFoundException>(() => TestApp.SendAsync(new SaveCandidatePhotoCommand(candidateId, Jpeg())));
        await Should.ThrowAsync<NotFoundException>(() => TestApp.SendAsync(new DeleteCandidatePhotoCommand(candidateId)));
        (await PhotoRowsAsync(candidateId)).ShouldBe(1);
    }

    [Test]
    public async Task ShouldBeDeletedWithItsCandidate()
    {
        var candidateId = await CandidateAsync();
        await TestApp.SendAsync(new SaveCandidatePhotoCommand(candidateId, Png()));

        using (var scope = FunctionalTestSetup.ScopeFactory.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            await db.Candidates.IgnoreQueryFilters().Where(c => c.Id == candidateId).ExecuteDeleteAsync();
        }

        (await PhotoRowsAsync(candidateId)).ShouldBe(0);
    }

    // The real endpoints, with the real sign-in: the upload is a multipart form like a browser sends.
    [Test]
    public async Task ShouldUploadAndDownloadThroughTheEndpointsOnlyWhenSignedIn()
    {
        var candidateId = await CandidateAsync();
        using (var scope = FunctionalTestSetup.ScopeFactory.CreateScope())
        {
            var users = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
            var user = (await users.FindByIdAsync(TestApp.GetUserId()!))!;
            user.EmailConfirmed = true;
            await users.UpdateAsync(user);
        }
        using var client = FunctionalTestSetup.Factory.CreateClient();
        (await client.GetAsync($"/api/CandidateProfiles/photo?candidateId={candidateId}")).StatusCode.ShouldBe(HttpStatusCode.Unauthorized);

        var login = await client.PostAsJsonAsync("/api/Users/login", new { email = "test@local", password = "Testing1234!" });
        login.EnsureSuccessStatusCode();
        var token = (await login.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("accessToken").GetString()!;
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        using var form = new MultipartFormDataContent { { new StringContent(candidateId.ToString()), "candidateId" } };
        var file = new ByteArrayContent(Jpeg());
        file.Headers.ContentType = new MediaTypeHeaderValue("image/png"); // the claimed type is ignored
        form.Add(file, "file", "me.png");
        (await client.PutAsync("/api/CandidateProfiles/photo", form)).StatusCode.ShouldBe(HttpStatusCode.NoContent);

        var download = await client.GetAsync($"/api/CandidateProfiles/photo?candidateId={candidateId}");
        download.StatusCode.ShouldBe(HttpStatusCode.OK);
        download.Content.Headers.ContentType!.MediaType.ShouldBe("image/jpeg");
        download.Headers.CacheControl!.ToString().ShouldContain("no-cache");
        (await download.Content.ReadAsByteArrayAsync()).Length.ShouldBe(204);

        using var notAnImage = new MultipartFormDataContent { { new StringContent(candidateId.ToString()), "candidateId" } };
        var pdf = new ByteArrayContent([0x25, 0x50, 0x44, 0x46, 0x2D, 1, 2, 3]);
        pdf.Headers.ContentType = new MediaTypeHeaderValue("image/jpeg");
        notAnImage.Add(pdf, "file", "me.jpg");
        (await client.PutAsync("/api/CandidateProfiles/photo", notAnImage)).StatusCode.ShouldBe(HttpStatusCode.BadRequest);
    }
}
