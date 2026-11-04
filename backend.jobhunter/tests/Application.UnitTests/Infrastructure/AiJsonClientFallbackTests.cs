using System.Net;
using backend.jobhunter.Application.Common.Exceptions;
using backend.jobhunter.Infrastructure.AiCommon;
using backend.jobhunter.Infrastructure.AiExtraction;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using NUnit.Framework;
using Shouldly;

namespace backend.jobhunter.Application.UnitTests.Infrastructure;

public class AiJsonClientFallbackTests
{
    private record Answer(string Text);

    private sealed class RoutingHandler(Func<HttpRequestMessage, string, HttpResponseMessage> respond) : HttpMessageHandler
    {
        public List<string> Hosts { get; } = [];

        protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            Hosts.Add(request.RequestUri!.Host);
            var body = request.Content is null ? "" : await request.Content.ReadAsStringAsync(cancellationToken);
            return respond(request, body);
        }
    }

    private sealed class CapturingLogger : ILogger<AiJsonClient>
    {
        public List<string> Lines { get; } = [];
        public IDisposable? BeginScope<TState>(TState state) where TState : notnull => null;
        public bool IsEnabled(LogLevel logLevel) => true;

        public void Log<TState>(LogLevel logLevel, EventId eventId, TState state, Exception? exception, Func<TState, Exception?, string> formatter)
            => Lines.Add(formatter(state, exception));
    }

    private static HttpResponseMessage Json(HttpStatusCode status, string json = "{}")
        => new(status) { Content = new StringContent(json) };

    private const string OpenAiOk = """{"choices":[{"finish_reason":"stop","message":{"content":"{\"text\":\"from openai\"}"}}],"usage":{"prompt_tokens":11,"completion_tokens":7}}""";
    private const string ClaudeOk = """{"stop_reason":"end_turn","content":[{"type":"text","text":"{\"text\":\"from claude\"}"}],"usage":{"input_tokens":21,"output_tokens":9}}""";

    private static AiJsonClient Client(RoutingHandler handler, ILogger<AiJsonClient> logger, AiExtractionOptions options)
    {
        var factory = new Mock<IHttpClientFactory>();
        factory.Setup(f => f.CreateClient(It.IsAny<string>())).Returns(() => new HttpClient(handler));
        return new AiJsonClient(
            factory.Object, Options.Create(options), logger,
            new LangfuseTelemetry(Options.Create(new LangfuseOptions())));
    }

    private static AiExtractionOptions Both() => new()
    {
        PreferredProvider = "OpenAI", OpenAiApiKey = "k1", AnthropicApiKey = "k2",
        OpenAiModel = "gpt-test", AnthropicModel = "claude-test",
    };

    private static Task<Answer> AskAsync(AiJsonClient client)
        => client.CompleteAsync<Answer>("rules", "secret prompt text", """{"type":"object"}""", "test", 100, null, null, default);

    [TestCase(HttpStatusCode.ServiceUnavailable)]
    [TestCase(HttpStatusCode.TooManyRequests)]
    [TestCase(HttpStatusCode.Unauthorized)]
    public async Task ShouldAnswerFromTheOtherProviderWhenThePreferredOneFails(HttpStatusCode openAiStatus)
    {
        var handler = new RoutingHandler((request, _) =>
            request.RequestUri!.Host == "api.openai.com" ? Json(openAiStatus) : Json(HttpStatusCode.OK, ClaudeOk));

        var answer = await AskAsync(Client(handler, new CapturingLogger(), Both()));

        answer.Text.ShouldBe("from claude");
        handler.Hosts.ShouldBe(["api.openai.com", "api.anthropic.com"]);
    }

    [Test]
    public async Task ShouldNotFallBackOnARefusalBecauseItWouldRepeat()
    {
        var handler = new RoutingHandler((request, _) => request.RequestUri!.Host == "api.openai.com"
            ? Json(HttpStatusCode.OK, """{"choices":[{"finish_reason":"stop","message":{"refusal":"no"}}]}""")
            : Json(HttpStatusCode.OK, ClaudeOk));

        var ex = await Should.ThrowAsync<AiServiceException>(() => AskAsync(Client(handler, new CapturingLogger(), Both())));

        ex.Failure.ShouldBe(AiFailure.Rejected);
        handler.Hosts.ShouldBe(["api.openai.com"]);
    }

    [Test]
    public async Task ShouldThrowTheOriginalErrorWhenOnlyOneProviderHasAKey()
    {
        var handler = new RoutingHandler((_, _) => Json(HttpStatusCode.ServiceUnavailable));
        var options = new AiExtractionOptions { PreferredProvider = "OpenAI", OpenAiApiKey = "k1" };

        var ex = await Should.ThrowAsync<AiServiceException>(() => AskAsync(Client(handler, new CapturingLogger(), options)));

        ex.Failure.ShouldBe(AiFailure.Unavailable);
        handler.Hosts.ShouldBe(["api.openai.com"]);
    }

    [Test]
    public async Task ShouldThrowTheLastErrorWhenEveryProviderFails()
    {
        var handler = new RoutingHandler((request, _) =>
            request.RequestUri!.Host == "api.openai.com" ? Json(HttpStatusCode.ServiceUnavailable) : Json(HttpStatusCode.TooManyRequests));

        var ex = await Should.ThrowAsync<AiServiceException>(() => AskAsync(Client(handler, new CapturingLogger(), Both())));

        ex.Failure.ShouldBe(AiFailure.RateLimited);
        handler.Hosts.ShouldBe(["api.openai.com", "api.anthropic.com"]);
    }

    [Test]
    public async Task ShouldStartWithTheOtherProviderWhenThatIsThePreferredOne()
    {
        var handler = new RoutingHandler((_, _) => Json(HttpStatusCode.OK, ClaudeOk));
        var options = Both();
        options.PreferredProvider = "Anthropic";

        (await AskAsync(Client(handler, new CapturingLogger(), options))).Text.ShouldBe("from claude");

        handler.Hosts.ShouldBe(["api.anthropic.com"]);
    }

    [Test]
    public async Task ShouldSayAiIsNotSetUpWhenNoProviderHasAKey()
    {
        var ex = await Should.ThrowAsync<AiServiceException>(() =>
            AskAsync(Client(new RoutingHandler((_, _) => Json(HttpStatusCode.OK)), new CapturingLogger(), new AiExtractionOptions())));

        ex.Failure.ShouldBe(AiFailure.NotConfigured);
    }

    [Test]
    public async Task ShouldLogOneLineWithModelTokensAndTimeButNeverThePromptOrTheAnswer()
    {
        var logger = new CapturingLogger();
        var handler = new RoutingHandler((_, _) => Json(HttpStatusCode.OK, OpenAiOk));

        await AskAsync(Client(handler, logger, Both()));

        var line = logger.Lines.ShouldHaveSingleItem();
        line.ShouldContain("AI call test on OpenAI gpt-test: 11 tokens in, 7 out");
        line.ShouldContain(" ms, ok");
        line.ShouldNotContain("secret prompt text");
        line.ShouldNotContain("from openai");
    }

    [Test]
    public async Task ShouldLogTheFailureOutcomeOfACallThatFell_Back()
    {
        var logger = new CapturingLogger();
        var handler = new RoutingHandler((request, _) =>
            request.RequestUri!.Host == "api.openai.com" ? Json(HttpStatusCode.ServiceUnavailable) : Json(HttpStatusCode.OK, ClaudeOk));

        await AskAsync(Client(handler, logger, Both()));

        logger.Lines.ShouldContain(l => l.Contains("on OpenAI gpt-test") && l.EndsWith("Unavailable"));
        logger.Lines.ShouldContain(l => l.Contains("trying Anthropic instead"));
        logger.Lines.ShouldContain(l => l.Contains("on Anthropic claude-test") && l.EndsWith("ok"));
    }
}
