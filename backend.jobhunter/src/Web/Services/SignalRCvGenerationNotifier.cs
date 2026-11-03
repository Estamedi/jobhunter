using backend.jobhunter.Application.Common.Interfaces;
using Microsoft.AspNetCore.SignalR;

namespace backend.jobhunter.Web.Services;

public class SignalRCvGenerationNotifier(IHubContext<CvGenerationHub> hub) : ICvGenerationNotifier
{
    // Clients.User matches the NameIdentifier claim, which is the same id the draft's owner has.
    public Task NotifyAsync(string ownerId, int draftId, string status, CancellationToken cancellationToken)
        => hub.Clients.User(ownerId).SendAsync(CvGenerationHub.ChangedEvent, new { draftId, status }, cancellationToken);
}
