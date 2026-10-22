using backend.jobhunter.Application.Common.Interfaces;
using backend.jobhunter.Application.Common.Security;
using backend.jobhunter.Domain.Entities;
using backend.jobhunter.Domain.Enums;

namespace backend.jobhunter.Application.CandidateProfiles.Commands.AddProfileLanguage;

[Authorize]
public record AddProfileLanguageCommand : IRequest<int>, ILanguageInput
{
    public required int CandidateId { get; init; }
    public required string Name { get; init; }
    public required string Proficiency { get; init; }
}

public class AddProfileLanguageCommandHandler(IApplicationDbContext context)
    : IRequestHandler<AddProfileLanguageCommand, int>
{
    public async Task<int> Handle(AddProfileLanguageCommand request, CancellationToken cancellationToken)
    {
        var profile = await context.GetOrCreateAsync(request.CandidateId, cancellationToken);

        var entity = new ProfileLanguage
        {
            Profile = profile,
            Name = request.Name.Trim(),
            Proficiency = Enum.Parse<LanguageProficiency>(request.Proficiency, ignoreCase: true),
            SortOrder = profile.Id == 0
                ? 0
                : (await context.ProfileLanguages.Where(x => x.ProfileId == profile.Id)
                    .MaxAsync(x => (int?)x.SortOrder, cancellationToken) ?? -1) + 1,
        };

        context.ProfileLanguages.Add(entity);
        await context.SaveChangesAsync(cancellationToken);

        return entity.Id;
    }
}
