using backend.jobhunter.Application.Common.Interfaces;
using backend.jobhunter.Application.Common.Security;

namespace backend.jobhunter.Application.JobExtraction.Commands.ExtractJob;

[Authorize]
public record ExtractJobCommand(string Url, string Title, string? JsonLd, string Text) : IRequest<ExtractedJobDto>;

public class ExtractJobCommandHandler(IJobExtractionAiService aiService)
    : IRequestHandler<ExtractJobCommand, ExtractedJobDto>
{
    public Task<ExtractedJobDto> Handle(ExtractJobCommand request, CancellationToken cancellationToken)
        => aiService.ExtractAsync(new JobPageContent(request.Url, request.Title, request.JsonLd, request.Text), cancellationToken);
}
