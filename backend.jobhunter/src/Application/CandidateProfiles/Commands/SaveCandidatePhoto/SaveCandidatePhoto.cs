using backend.jobhunter.Application.Common.Interfaces;
using backend.jobhunter.Application.Common.Security;
using backend.jobhunter.Domain.Entities;
using FluentValidation.Results;

namespace backend.jobhunter.Application.CandidateProfiles.Commands.SaveCandidatePhoto;

// Sets or replaces the photo for a candidate's CV.
[Authorize]
public record SaveCandidatePhotoCommand(int CandidateId, byte[] Data) : IRequest;

public class SaveCandidatePhotoCommandHandler(IApplicationDbContext context)
    : IRequestHandler<SaveCandidatePhotoCommand>
{
    public async Task Handle(SaveCandidatePhotoCommand request, CancellationToken cancellationToken)
    {
        if (request.Data.Length == 0 || request.Data.Length > CandidatePhotoRules.MaxBytes)
        {
            throw Invalid($"The photo must be between 1 byte and {CandidatePhotoRules.MaxBytes / (1024 * 1024)} MB.");
        }

        var contentType = CandidatePhotoRules.ContentTypeOf(request.Data)
            ?? throw Invalid("The photo must be a JPEG or PNG image.");

        if (!await context.Candidates.AnyAsync(c => c.Id == request.CandidateId, cancellationToken))
        {
            throw new NotFoundException(nameof(Candidate), request.CandidateId);
        }

        var photo = await context.CandidatePhotos.FirstOrDefaultAsync(p => p.CandidateId == request.CandidateId, cancellationToken);
        if (photo is null)
        {
            photo = new CandidatePhoto { CandidateId = request.CandidateId };
            context.CandidatePhotos.Add(photo);
        }

        photo.Data = request.Data;
        photo.ContentType = contentType;
        await context.SaveChangesAsync(cancellationToken);
    }

    private static Common.Exceptions.ValidationException Invalid(string message)
        => new([new ValidationFailure("file", message)]);
}
