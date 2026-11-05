namespace backend.jobhunter.Application.Common.Interfaces;

// Holds emails until a background worker sends them.
public interface IEmailQueue
{
    void Enqueue(string to, string subject, string htmlMessage, string? fromEmail = null, string? fromName = null);
}
