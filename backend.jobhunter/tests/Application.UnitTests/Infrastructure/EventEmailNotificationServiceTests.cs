using backend.jobhunter.Application.Notifications.EventHandlers;
using backend.jobhunter.Domain.Events;
using backend.jobhunter.Infrastructure.Notification;
using MediatR;
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
        var service = new EventEmailNotificationService(publisher.Object);

        await service.SendEmailAsync("a@b.com", "Hi", "<p>Body</p>");

        publisher.Verify(p => p.Publish(
            It.Is<EmailRequestedEvent>(e => e.To == "a@b.com" && e.Subject == "Hi" && e.FromEmail == null),
            It.IsAny<CancellationToken>()), Times.Once);
    }

    [Test]
    public async Task Handler_QueuesTheEmailForTheWorker()
    {
        var queue = new EmailQueue();
        var handler = new EmailRequestedEventHandler(queue);

        await handler.Handle(new EmailRequestedEvent("c@d.com", "Yo", "<p>Two</p>", "from@x.com", "From"), CancellationToken.None);

        using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(1));
        await foreach (var job in queue.ReadAllAsync(cts.Token))
        {
            job.ShouldBe(new EmailJob("c@d.com", "Yo", "<p>Two</p>", "from@x.com", "From"));
            break;
        }
    }
}
