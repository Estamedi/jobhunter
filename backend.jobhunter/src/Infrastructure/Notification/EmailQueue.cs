using System.Threading.Channels;
using backend.jobhunter.Application.Common.Interfaces;

namespace backend.jobhunter.Infrastructure.Notification;

// One email waiting to be sent. FromEmail/FromName are null when the default sender should be used.
public record EmailJob(string To, string Subject, string HtmlMessage, string? FromEmail = null, string? FromName = null);

// In-memory queue between whoever asks for an email and EmailWorker. Unbounded so a write never drops mail;
// like the other workers it assumes one backend instance, and unsent mail is lost on a restart.
public class EmailQueue : IEmailQueue
{
    private readonly Channel<EmailJob> _channel = Channel.CreateUnbounded<EmailJob>(
        new UnboundedChannelOptions { SingleReader = true });

    public void Enqueue(string to, string subject, string htmlMessage, string? fromEmail = null, string? fromName = null) =>
        _channel.Writer.TryWrite(new EmailJob(to, subject, htmlMessage, fromEmail, fromName));

    public IAsyncEnumerable<EmailJob> ReadAllAsync(CancellationToken cancellationToken) =>
        _channel.Reader.ReadAllAsync(cancellationToken);
}
