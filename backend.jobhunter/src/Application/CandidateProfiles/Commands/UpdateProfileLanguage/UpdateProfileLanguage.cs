using backend.jobhunter.Application.Common.Interfaces;
using backend.jobhunter.Application.Common.Security;
using backend.jobhunter.Domain.Entities;
using backend.jobhunter.Domain.Enums;

namespace backend.jobhunter.Application.CandidateProfiles.Commands.UpdateProfileLanguage;

[Authorize]
public record UpdateProfileLanguageCommand : IRequest, ILanguageInput
{
    public required int Id { get; init; }
    public required string Name { get; init; }
    public required string Proficiency { get; init; }
}

public class UpdateProfileLanguageCommandHandler(IApplicationDbContext context)
    : IRequestHandler<UpdateProfileLanguageCommand>
{
    public async Task Handle(UpdateProfileLanguageCommand request, CancellationToken cancellationToken)
    {
        var entity = await context.ProfileLanguages.FindAsync([request.Id], cancellationToken)
            ?? throw new NotFoundException(nameof(ProfileLanguage), request.Id);

        entity.Name = request.Name.Trim();
        entity.Proficiency = Enum.Parse<LanguageProficiency>(request.Proficiency, ignoreCase: true);

        await context.SaveChangesAsync(cancellationToken);
    }
}
