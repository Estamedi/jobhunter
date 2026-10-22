using backend.jobhunter.Application.Common.Interfaces;
using QuestPDF.Fluent;
using QuestPDF.Infrastructure;

namespace backend.jobhunter.Infrastructure.CvRendering;

public class QuestPdfCvRenderer : ICvPdfRenderer
{
    static QuestPdfCvRenderer()
    {
        // QuestPDF Community licence (free below its revenue threshold); review if that changes.
        QuestPDF.Settings.License = LicenseType.Community;
    }

    public byte[] Render(string templateId, CvHeaderDto header, GeneratedCvDto content)
    {
        IDocument document = templateId switch
        {
            CvTemplates.Classic => new ClassicCvDocument(header, content),
            _ => new ClassicCvDocument(header, content),
        };

        return document.GeneratePdf();
    }
}
