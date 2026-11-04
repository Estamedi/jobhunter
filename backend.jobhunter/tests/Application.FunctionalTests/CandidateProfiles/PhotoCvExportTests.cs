using backend.jobhunter.Application.Common.Interfaces;
using backend.jobhunter.Application.CandidateProfiles.Commands.SaveCandidatePhoto;
using backend.jobhunter.Application.CvDrafts;
using backend.jobhunter.Application.CvDrafts.Commands.ExportCvDraft;
using backend.jobhunter.Domain.Entities;
using backend.jobhunter.Infrastructure.CvRendering;
using backend.jobhunter.Infrastructure.CvImport;
using backend.jobhunter.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using UglyToad.PdfPig;

namespace backend.jobhunter.Application.FunctionalTests.CandidateProfiles;

// The whole path: a photo and an availability saved on the candidate, a draft on the photo template,
// and an export that reads them from the database.
public class PhotoCvExportTests : TestBase
{
    private static readonly byte[] SamplePhoto = CvImages.QrCodePng("stand-in for a photo");

    private static async Task<(int CandidateId, int DraftId)> SetUpAsync(string templateId, bool withPhoto)
    {
        await TestApp.RunAsDefaultUserAsync();
        int candidateId, draftId;
        using (var scope = FunctionalTestSetup.ScopeFactory.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var candidate = new Candidate { FullName = "Jane Sample", Email = "jane@example.com", Phone = "123", CurrentLocation = "Muscat", Availability = "Immediately" };
            var draft = new CvDraft
            {
                Candidate = candidate, Title = "CV", JobTitle = "Engineer", TemplateId = templateId,
                ContentJson = CvDraftContent.Serialize(new GeneratedCvDto { Headline = "Engineer", Summary = "Engineer with 8 years of experience." }),
            };
            db.CvDrafts.Add(draft);
            await db.SaveChangesAsync();
            candidateId = candidate.Id;
            draftId = draft.Id;
        }
        if (withPhoto) await TestApp.SendAsync(new SaveCandidatePhotoCommand(candidateId, SamplePhoto));
        return (candidateId, draftId);
    }

    private static async Task<byte[]> ExportAsync(int draftId, string format)
    {
        var result = await TestApp.SendAsync(new ExportCvDraftCommand(draftId, format));
        using var scope = FunctionalTestSetup.ScopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var key = await db.Cvs.Where(c => c.Id == result.CvId).Select(c => c.StorageKey).SingleAsync();
        await using var stream = await scope.ServiceProvider.GetRequiredService<IFileStorage>().OpenReadAsync(key, default);
        using var memory = new MemoryStream();
        await stream.CopyToAsync(memory);
        return memory.ToArray();
    }

    private static int Images(byte[] pdf)
    {
        using var document = PdfDocument.Open(pdf);
        return document.GetPages().Sum(p => p.GetImages().Count());
    }

    [Test]
    public async Task ShouldPutTheSavedPhotoAndAvailabilityInThePdfOfAPhotoDraft()
    {
        var (_, draftId) = await SetUpAsync("photo", withPhoto: true);

        var pdf = await ExportAsync(draftId, "pdf");

        Images(pdf).ShouldBe(1);
        using var stream = new MemoryStream(pdf);
        (await new CvTextExtractor().ExtractTextAsync(stream, "cv.pdf", default)).ShouldContain("Availability: Immediately");
    }

    [Test]
    public async Task ShouldPutThePhotoInTheWordFileOfAPhotoDraft()
    {
        var (_, draftId) = await SetUpAsync("photo", withPhoto: true);

        var docx = await ExportAsync(draftId, "docx");

        using var document = DocumentFormat.OpenXml.Packaging.WordprocessingDocument.Open(new MemoryStream(docx), false);
        document.MainDocumentPart!.ImageParts.Count().ShouldBe(1);
    }

    [Test]
    public async Task ShouldExportAPhotoDraftWithoutAPhotoAndNeverShowThePhotoOnAnotherTemplate()
    {
        var (_, noPhoto) = await SetUpAsync("photo", withPhoto: false);
        Images(await ExportAsync(noPhoto, "pdf")).ShouldBe(0);

        using (var scope = FunctionalTestSetup.ScopeFactory.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var candidateId = await db.Candidates.Select(c => c.Id).SingleAsync();
            await TestApp.SendAsync(new SaveCandidatePhotoCommand(candidateId, SamplePhoto));
            await db.CvDrafts.Where(d => d.Id == noPhoto).ExecuteUpdateAsync(s => s.SetProperty(d => d.TemplateId, "classic"));
        }

        Images(await ExportAsync(noPhoto, "pdf")).ShouldBe(0);
    }
}
