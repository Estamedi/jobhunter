using backend.jobhunter.Application.Common.Interfaces;
using backend.jobhunter.Application.Common.Security;
using backend.jobhunter.Domain.Entities;

namespace backend.jobhunter.Application.Cvs.Commands.UploadCv;

[Authorize]
public record UploadCvCommand : IRequest<int>
{
    public required int CandidateId { get; init; }
    public required string FileName { get; init; }
    public required string ContentType { get; init; }
    public required long FileSizeBytes { get; init; }
    public required Stream Content { get; init; }
}

public class UploadCvCommandHandler(IApplicationDbContext context, IFileStorage fileStorage)
    : IRequestHandler<UploadCvCommand, int>
{
    public async Task<int> Handle(UploadCvCommand request, CancellationToken cancellationToken)
    {
        var candidateExists = await context.Candidates.AnyAsync(c => c.Id == request.CandidateId, cancellationToken);
        if (!candidateExists)
        {
            throw new NotFoundException(nameof(Candidate), request.CandidateId);
        }

        // The browser-supplied extension and content type are not trusted: the file must start with the
        // signature of the format its extension claims, and the stored content type comes from our own map.
        var extension = Path.GetExtension(request.FileName);
        if (!await HasExpectedSignatureAsync(request.Content, extension, cancellationToken))
        {
            throw new ValidationException(
            [
                new FluentValidation.Results.ValidationFailure(nameof(request.FileName), "The file content does not match its type."),
            ]);
        }

        var contentType = UploadCvCommandValidator.AllowedTypes[extension];

        var storageKey = await fileStorage.SaveAsync(request.Content, request.FileName, cancellationToken);

        var entity = new Cv
        {
            CandidateId = request.CandidateId,
            FileName = request.FileName,
            ContentType = contentType,
            FileSizeBytes = request.FileSizeBytes,
            StorageKey = storageKey,
        };

        context.Cvs.Add(entity);
        await context.SaveChangesAsync(cancellationToken);

        return entity.Id;
    }

    private static async Task<bool> HasExpectedSignatureAsync(Stream content, string extension, CancellationToken cancellationToken)
    {
        if (!content.CanSeek)
        {
            return true;
        }

        var header = new byte[8];
        var read = await content.ReadAsync(header, cancellationToken);
        content.Position = 0;

        ReadOnlySpan<byte> bytes = header.AsSpan(0, read);

        return extension.ToLowerInvariant() switch
        {
            ".pdf" => bytes.StartsWith("%PDF"u8),
            ".docx" => bytes.StartsWith("PK"u8),
            ".doc" => bytes.StartsWith(new byte[] { 0xD0, 0xCF, 0x11, 0xE0 }) || bytes.StartsWith("PK"u8),
            _ => false,
        };
    }
}
