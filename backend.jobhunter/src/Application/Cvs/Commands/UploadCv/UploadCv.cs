using backend.jobhunter.Application.Common.Interfaces;
using backend.jobhunter.Application.Common.Security;
using backend.jobhunter.Domain.Entities;

namespace backend.jobhunter.Application.Cvs.Commands.UploadCv;

[Authorize]
public record UploadCvCommand : IRequest<int>
{
    public required int CandidateId { get; init; }
    public int? ApplicationId { get; init; }
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

        if (request.ApplicationId is int applicationId)
        {
            var applicationExists = await context.Applications.AnyAsync(a => a.Id == applicationId, cancellationToken);
            if (!applicationExists)
            {
                throw new NotFoundException(nameof(JobApplication), applicationId);
            }
        }

        var storageKey = await fileStorage.SaveAsync(request.Content, request.FileName, cancellationToken);

        var entity = new Cv
        {
            CandidateId = request.CandidateId,
            ApplicationId = request.ApplicationId,
            FileName = request.FileName,
            ContentType = request.ContentType,
            FileSizeBytes = request.FileSizeBytes,
            StorageKey = storageKey,
        };

        context.Cvs.Add(entity);
        await context.SaveChangesAsync(cancellationToken);

        return entity.Id;
    }
}
