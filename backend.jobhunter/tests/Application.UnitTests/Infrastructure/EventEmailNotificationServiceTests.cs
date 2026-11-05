using Hangfire;
using Hangfire.Common;
using Hangfire.States;
using backend.jobhunter.Application.Notifications.EventHandlers;
using backend.jobhunter.Domain.Events;
using backend.jobhunter.Infrastructure.Notification;
using MediatR;
using Microsoft.Extensions.DependencyInjection;
using Moq;
using NUnit.Framework;
using Shouldly;

namespace backend.jobhunter.Application.UnitTests.Infrastructure;

public class EventEmailNotificationServiceTests
{
    [Test]
    public async Task Send_RaisesAnEmailRequestedEvent()
    {
        var publisher = new Mock<IPublisher>();
        var provider = new ServiceCollection().AddSingleton(publisher.Object).BuildServiceProvider();
        var service = new EventEmailNotificationService(provider.GetRequiredService<IServiceScopeFactory>());

        await service.SendEmailAsync("a@b.com", "Hi", "<p>Body</p>");

        publisher.Verify(p => p.Publish(
            It.Is<EmailRequestedEvent>(e => e.To == "a@b.com" && e.Subject == "Hi" && e.FromEmail == null),
            It.IsAny<CancellationToken>()), Times.Once);
    }

    [Test]
    public async Task Handler_QueuesTheEmailAsABackgroundJob()
    {
        var client = new Mock<IBackgroundJobClient>();
        var queue = new EmailQueue(client.Object);
        var handler = new EmailRequestedEventHandler(queue);

        await handler.Handle(new EmailRequestedEvent("c@d.com", "Yo", "<p>Two</p>", "from@x.com", "From"), CancellationToken.None);

        client.Verify(c => c.Create(
            It.Is<Job>(j => j.Type == typeof(EmailWorker) && j.Method.Name == nameof(EmailWorker.SendAsync)
                && (string)j.Args[0] == "c@d.com" && (string)j.Args[1] == "Yo" && (string)j.Args[2] == "<p>Two</p>"
                && (string)j.Args[3] == "from@x.com" && (string)j.Args[4] == "From"),
            It.IsAny<IState>()), Times.Once);
    }
}
