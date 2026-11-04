using backend.jobhunter.Application.Common.Interfaces;
using backend.jobhunter.Application.Common.Security;
using backend.jobhunter.Domain.Constants;
using backend.jobhunter.Domain.Entities;

namespace backend.jobhunter.Application.Settings.Commands.UpdateAiActions;

/// <summary>Provider and model for one AI action. Null or empty values clear the override (the default is used).</summary>
public record AiActionChoice(string Action, string? Provider, string? Model);

[Authorize(Roles = Roles.Administrator)]
public record UpdateAiActionsCommand(IReadOnlyList<AiActionChoice> Actions) : IRequest;

public class UpdateAiActionsCommandValidator : AbstractValidator<UpdateAiActionsCommand>
{
    public UpdateAiActionsCommandValidator(IAiProviderCatalog catalog)
    {
        RuleForEach(x => x.Actions).ChildRules(a =>
        {
            a.RuleFor(x => x.Action).Must(k => AiActions.All.Any(d => d.Key == k)).WithMessage("Unknown AI action.");
            a.RuleFor(x => x.Provider)
                .Must(p => string.IsNullOrWhiteSpace(p) || catalog.Providers.Any(c => c.Name == p))
                .WithMessage("Unknown AI provider.");
            a.RuleFor(x => x.Model).MaximumLength(200);
        });
    }
}

public class UpdateAiActionsCommandHandler(IApplicationDbContext context) : IRequestHandler<UpdateAiActionsCommand>
{
    public async Task Handle(UpdateAiActionsCommand request, CancellationToken cancellationToken)
    {
        var keys = request.Actions
            .SelectMany(a => new[] { AiSettingKeys.ActionProvider(a.Action), AiSettingKeys.ActionModel(a.Action) })
            .ToList();
        var existing = await context.AppSettings.Where(s => keys.Contains(s.Key)).ToDictionaryAsync(s => s.Key, cancellationToken);

        void Apply(string key, string? value)
        {
            existing.TryGetValue(key, out var setting);
            if (string.IsNullOrWhiteSpace(value))
            {
                if (setting is not null) context.AppSettings.Remove(setting);
            }
            else if (setting is null) context.AppSettings.Add(new AppSetting { Key = key, Value = value.Trim() });
            else setting.Value = value.Trim();
        }

        foreach (var a in request.Actions)
        {
            Apply(AiSettingKeys.ActionProvider(a.Action), a.Provider);
            // A model name only makes sense with a provider chosen for the action.
            Apply(AiSettingKeys.ActionModel(a.Action), string.IsNullOrWhiteSpace(a.Provider) ? null : a.Model);
        }

        await context.SaveChangesAsync(cancellationToken);
    }
}
