using System.Net;
using backend.jobhunter.Application.Common.Exceptions;
using backend.jobhunter.Infrastructure.AiCommon;
using backend.jobhunter.Infrastructure.AiExtraction;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Moq;
using NUnit.Framework;
using Shouldly;

namespace backend.jobhunter.Application.UnitTests.Infrastructure;

public class AiJsonClientTests
{
    private const string SecretBody = "Incorrect API key provided: sk-proj-SECRETSECRET";

    private sealed class StubHandler(HttpStatusCode status, string body) : HttpMessageHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
            => Task.FromResult(new HttpResponseMessage(status) { Content = new StringContent(body) });
    }

    private sealed class ThrowingHandler : HttpMessageHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
            => throw new HttpRequestException("connection refused");
    }

    private static AiJsonClient Client(HttpMessageHandler handler, AiExtractionOptions? options = null)
    {
        var factory = new Mock<IHttpClientFactory>();
        factory.Setup(f => f.CreateClient(It.IsAny<string>())).Returns(() => new HttpClient(handler));
        return new AiJsonClient(
            factory.Object,
            Options.Create(options ?? new AiExtractionOptions { PreferredProvider = "OpenAI", OpenAiApiKey = "k" }),
            NullLogger<AiJsonClient>.Instance);
    }

    private static Task<object> Call(AiJsonClient client)
        => client.CompleteAsync<object>("system", "user", """{"type":"object"}""", "x", 100, null, null, default);

    [TestCase(HttpStatusCode.Unauthorized, AiFailure.NotConfigured)]
    [TestCase(HttpStatusCode.Forbidden, AiFailure.NotConfigured)]
    [TestCase(HttpStatusCode.TooManyRequests, AiFailure.RateLimited)]
    [TestCase(HttpStatusCode.InternalServerError, AiFailure.Unavailable)]
    [TestCase(HttpStatusCode.NotFound, AiFailure.Unavailable)]
    public async Task ShouldTurnProviderErrorsIntoSafeMessages(HttpStatusCode status, AiFailure expected)
    {
        var ex = await Should.ThrowAsync<AiServiceException>(() => Call(Client(new StubHandler(status, SecretBody))));

        ex.Failure.ShouldBe(expected);
        ex.Message.ShouldNotContain("sk-proj");
        ex.Message.ShouldNotContain("Incorrect API key");
    }

    [Test]
    public async Task ShouldReportNetworkFailuresAsUnavailable()
    {
        var ex = await Should.ThrowAsync<AiServiceException>(() => Call(Client(new ThrowingHandler())));

        ex.Failure.ShouldBe(AiFailure.Unavailable);
    }

    [Test]
    public async Task ShouldReportAMissingProviderAsNotConfigured()
    {
        var client = Client(new StubHandler(HttpStatusCode.OK, "{}"), new AiExtractionOptions());

        var ex = await Should.ThrowAsync<AiServiceException>(() => Call(client));

        ex.Failure.ShouldBe(AiFailure.NotConfigured);
    }

    [Test]
    public async Task ShouldReportATruncatedAnswerAsRejected()
    {
        var body = """{"choices":[{"finish_reason":"length","message":{"content":"{"}}]}""";

        var ex = await Should.ThrowAsync<AiServiceException>(() => Call(Client(new StubHandler(HttpStatusCode.OK, body))));

        ex.Failure.ShouldBe(AiFailure.Rejected);
    }

    [Test]
    public async Task ShouldStillBeAnInvalidOperationExceptionForExistingCallers()
    {
        await Should.ThrowAsync<InvalidOperationException>(() => Call(Client(new StubHandler(HttpStatusCode.TooManyRequests, ""))));
    }
}
