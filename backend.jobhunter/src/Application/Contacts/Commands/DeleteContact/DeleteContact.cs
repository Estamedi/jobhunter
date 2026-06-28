using backend.jobhunter.Application.Common.Exceptions;
using backend.jobhunter.Application.Common.Interfaces;
using backend.jobhunter.Application.Common.Security;

namespace backend.jobhunter.Application.Contacts.Commands.DeleteContact;

[Authorize]
public record DeleteContactCommand(int Id) : IRequest;

public class DeleteContactCommandHandler(IApplicationDbContext context)
    : IRequestHandler<DeleteContactCommand>
{
    public async Task Handle(DeleteContactCommand request, CancellationToken cancellationToken)
    {
        var entity = await context.Contacts.FindAsync([request.Id], cancellationToken)
            ?? throw new NotFoundException("Contact", request.Id);

        context.Contacts.Remove(entity);
        await context.SaveChangesAsync(cancellationToken);
    }
}
