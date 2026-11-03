namespace backend.jobhunter.Application.Common.Interfaces;

// Tells the draft's owner, live, that a draft changed state. Only the id and status are sent; the
// browser then reads the draft with its own login. Optional: without a notifier the UI just polls.
public interface ICvGenerationNotifier
{
    Task NotifyAsync(string ownerId, int draftId, string status, CancellationToken cancellationToken);
}
