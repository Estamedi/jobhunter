using backend.jobhunter.Application.Common.Interfaces;
using backend.jobhunter.Application.Common.Security;
using backend.jobhunter.Domain.Entities;

namespace backend.jobhunter.Application.Cvs.Commands.DeleteCv;

[Authorize]
public record DeleteCvCommand(int Id) : IRequest;

public class DeleteCvCommandHandler(IApplicationDbContext context, IFileStorage fileStorage)
    : IRequestHandler<DeleteCvCommand>
{
    public async Task Handle(DeleteCvCommand request, CancellationToken cancellationToken)
    {
        var entity = await context.Cvs.FindAsync([request.Id], cancellationToken)
            ?? throw new NotFoundException(nameof(Cv), request.Id);

        context.Cvs.Remove(entity);
        await context.SaveChangesAsync(cancellationToken);

        await fileStorage.DeleteAsync(entity.StorageKey, cancellationToken);
    }
}
