namespace backend.jobhunter.Application.Common.Exceptions;

public enum AiFailure
{
    // The server has no usable API key or the provider rejected it.
    NotConfigured,
    // The provider is rate limiting us or the account is out of quota.
    RateLimited,
    // The model refused, or its answer was cut off or unreadable.
    Rejected,
    // Network trouble, a provider outage or an unexpected provider error.
    Unavailable,
}

// Thrown when an AI provider call fails. The message is safe to show to the user: it never carries
// the provider's response body, which can echo request details.
public class AiServiceException(AiFailure failure, string message) : InvalidOperationException(message)
{
    public AiFailure Failure { get; } = failure;
}
