namespace backend.jobhunter.Domain.Events;

// Raised whenever the app wants an email sent. FromEmail/FromName are null for the default sender.
public class EmailRequestedEvent(string to, string subject, string htmlMessage, string? fromEmail = null, string? fromName = null) : BaseEvent
{
    public string To { get; } = to;
    public string Subject { get; } = subject;
    public string HtmlMessage { get; } = htmlMessage;
    public string? FromEmail { get; } = fromEmail;
    public string? FromName { get; } = fromName;
}
