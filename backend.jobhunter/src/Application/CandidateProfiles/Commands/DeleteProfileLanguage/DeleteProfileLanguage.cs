using backend.jobhunter.Application.Common.Interfaces;
using backend.jobhunter.Application.Common.Security;
using backend.jobhunter.Domain.Entities;

namespace backend.jobhunter.Application.CandidateProfiles.Commands.DeleteProfileLanguage;

[Authorize]
public record DeleteProfileLanguageCommand(int Id) : IRequest;

public class DeleteProfileLanguageCommandHandler(IApplicationDbContext context)
    : IRequestHandler<DeleteProfileLanguageCommand>
{
    public async Task Handle(DeleteProfileLanguageCommand request, CancellationToken cancellationToken)
    {
        var entity = await context.ProfileLanguages.FindAsync([request.Id], cancellationToken)
            ?? throw new NotFoundException(nameof(ProfileLanguage), request.Id);

        context.ProfileLanguages.Remove(entity);
        await context.SaveChangesAsync(cancellationToken);
    }
}
