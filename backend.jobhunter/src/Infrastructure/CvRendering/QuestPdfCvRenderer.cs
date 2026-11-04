using backend.jobhunter.Application.Common.Interfaces;
using QuestPDF.Drawing;
using QuestPDF.Fluent;
using QuestPDF.Infrastructure;

namespace backend.jobhunter.Infrastructure.CvRendering;

public class QuestPdfCvRenderer : ICvPdfRenderer
{
    static QuestPdfCvRenderer()
    {
        // QuestPDF Community licence (free below its revenue threshold); review if that changes.
        QuestPDF.Settings.License = LicenseType.Community;

        // Carlito (OFL, metric-compatible with Calibri) is embedded so output never depends on system fonts.
        var assembly = typeof(QuestPdfCvRenderer).Assembly;
        foreach (var name in assembly.GetManifestResourceNames().Where(n => n.EndsWith(".ttf", StringComparison.OrdinalIgnoreCase)))
        {
            FontManager.RegisterFontFromEmbeddedResource(name);
        }
    }

    public byte[] Render(string templateId, CvHeaderDto header, GeneratedCvDto content)
    {
        // Every template shares one layout; an unknown id falls back to the classic look.
        IDocument document = new ClassicCvDocument(header, content, CvStyles.For(templateId));

        return document.GeneratePdf();
    }
}
