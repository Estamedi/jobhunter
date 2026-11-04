using QRCoder;
using QuestPDF.Infrastructure;

namespace backend.jobhunter.Infrastructure.CvRendering;

// The pictures on the photo template.
public static class CvImages
{
    // A photo that cannot be decoded is dropped, so a bad image never fails an export.
    public static byte[]? UsablePhoto(byte[]? bytes)
    {
        if (bytes is null || bytes.Length == 0) return null;

        try
        {
            using var image = Image.FromBinaryData(bytes);
            return bytes;
        }
        catch (Exception)
        {
            return null;
        }
    }

    // A QR code of a link, as a PNG. Used in the PDF and the Word file, so both show the same picture.
    public static byte[] QrCodePng(string text)
    {
        using var generator = new QRCodeGenerator();
        using var data = generator.CreateQrCode(text, QRCodeGenerator.ECCLevel.M);
        return new PngByteQRCode(data).GetGraphic(8);
    }
}
