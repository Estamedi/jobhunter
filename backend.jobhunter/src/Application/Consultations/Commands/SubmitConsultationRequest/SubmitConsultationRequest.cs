using backend.jobhunter.Application.Common.Interfaces;
using backend.jobhunter.Domain.Entities;

namespace backend.jobhunter.Application.Consultations.Commands.SubmitConsultationRequest;

/// <summary>Public: sent from the marketing website by someone who may not have an account.</summary>
public record SubmitConsultationRequestCommand : IRequest<int>
{
    public required string FullName { get; init; }
    public string? Email { get; init; }
    public required string Phone { get; init; }
    public string? Message { get; init; }
    public string? Locale { get; init; }

    /// <summary>A hidden field real people never fill in; bots do. A filled value is dropped silently.</summary>
    public string? Website { get; init; }
}

public class SubmitConsultationRequestCommandValidator : AbstractValidator<SubmitConsultationRequestCommand>
{
    public SubmitConsultationRequestCommandValidator()
    {
        RuleFor(x => x.FullName).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Email).MaximumLength(256).EmailAddress().When(x => !string.IsNullOrWhiteSpace(x.Email));
        RuleFor(x => x.Phone).NotEmpty().MaximumLength(50);
        RuleFor(x => x.Message).MaximumLength(2000);
        RuleFor(x => x.Locale).MaximumLength(10);
    }
}

public class SubmitConsultationRequestCommandHandler(IApplicationDbContext context)
    : IRequestHandler<SubmitConsultationRequestCommand, int>
{
    public async Task<int> Handle(SubmitConsultationRequestCommand request, CancellationToken cancellationToken)
    {
        if (!string.IsNullOrWhiteSpace(request.Website)) return 0;

        var lead = new ConsultationLead
        {
            Created = DateTimeOffset.UtcNow,
            FullName = request.FullName.Trim(),
            Email = string.IsNullOrWhiteSpace(request.Email) ? null : request.Email.Trim(),
            Phone = request.Phone.Trim(),
            Message = string.IsNullOrWhiteSpace(request.Message) ? null : request.Message.Trim(),
            Locale = string.IsNullOrWhiteSpace(request.Locale) ? null : request.Locale.Trim(),
        };

        context.ConsultationLeads.Add(lead);
        await context.SaveChangesAsync(cancellationToken);

        return lead.Id;
    }
}
