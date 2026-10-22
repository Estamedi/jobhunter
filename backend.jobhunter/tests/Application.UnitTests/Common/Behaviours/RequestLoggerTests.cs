using backend.jobhunter.Application.Common.Behaviours;
using backend.jobhunter.Application.Common.Interfaces;
using backend.jobhunter.Application.CvDrafts.Queries.GetCvDraft;
using Microsoft.Extensions.Logging;
using Moq;
using NUnit.Framework;

namespace backend.jobhunter.Application.UnitTests.Common.Behaviours;

public class RequestLoggerTests
{
    private Mock<ILogger<GetCvDraftQuery>> _logger = null!;
    private Mock<IUser> _user = null!;
    private Mock<IIdentityService> _identityService = null!;

    [SetUp]
    public void Setup()
    {
        _logger = new Mock<ILogger<GetCvDraftQuery>>();
        _user = new Mock<IUser>();
        _identityService = new Mock<IIdentityService>();
    }

    [Test]
    public async Task ShouldCallGetUserNameAsyncOnceIfAuthenticated()
    {
        _user.Setup(x => x.Id).Returns(Guid.NewGuid().ToString());

        var requestLogger = new LoggingBehaviour<GetCvDraftQuery>(_logger.Object, _user.Object, _identityService.Object);

        await requestLogger.Process(new GetCvDraftQuery(1), new CancellationToken());

        _identityService.Verify(i => i.GetUserNameAsync(It.IsAny<string>()), Times.Once);
    }

    [Test]
    public async Task ShouldNotCallGetUserNameAsyncOnceIfUnauthenticated()
    {
        var requestLogger = new LoggingBehaviour<GetCvDraftQuery>(_logger.Object, _user.Object, _identityService.Object);

        await requestLogger.Process(new GetCvDraftQuery(1), new CancellationToken());

        _identityService.Verify(i => i.GetUserNameAsync(It.IsAny<string>()), Times.Never);
    }
}
