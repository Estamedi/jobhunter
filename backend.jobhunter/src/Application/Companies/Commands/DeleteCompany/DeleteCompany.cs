using backend.jobhunter.Application.Common.Exceptions;
using backend.jobhunter.Application.Common.Interfaces;
using backend.jobhunter.Application.Common.Security;

namespace backend.jobhunter.Application.Companies.Commands.DeleteCompany;

[Authorize]
public record DeleteCompanyCommand(int Id) : IRequest;

public class DeleteCompanyCommandHandler(IApplicationDbContext context)
    : IRequestHandler<DeleteCompanyCommand>
{
    public async Task Handle(DeleteCompanyCommand request, CancellationToken cancellationToken)
    {
        var entity = await context.Companies.FindAsync([request.Id], cancellationToken)
            ?? throw new NotFoundException("Company", request.Id);

        context.Companies.Remove(entity);
        await context.SaveChangesAsync(cancellationToken);
    }
}
