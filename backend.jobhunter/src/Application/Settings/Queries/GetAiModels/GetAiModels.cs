using backend.jobhunter.Application.Common.Interfaces;
using backend.jobhunter.Application.Common.Security;
using backend.jobhunter.Domain.Constants;

namespace backend.jobhunter.Application.Settings.Queries.GetAiModels;

[Authorize(Roles = Roles.Administrator)]
public record GetAiModelsQuery(string Provider) : IRequest<AiModelList>;

public class GetAiModelsQueryValidator : AbstractValidator<GetAiModelsQuery>
{
    public GetAiModelsQueryValidator(IAiProviderCatalog catalog)
    {
        RuleFor(x => x.Provider)
            .Must(p => catalog.Providers.Any(c => c.Name == p))
            .WithMessage("Unknown AI provider.");
    }
}

public class GetAiModelsQueryHandler(IAiModelCatalog catalog) : IRequestHandler<GetAiModelsQuery, AiModelList>
{
    public Task<AiModelList> Handle(GetAiModelsQuery request, CancellationToken cancellationToken)
        => catalog.ListAsync(request.Provider, cancellationToken);
}
