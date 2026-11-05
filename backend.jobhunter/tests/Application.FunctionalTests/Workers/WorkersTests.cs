using backend.jobhunter.Application.Common.Exceptions;
using backend.jobhunter.Application.Workers.Commands;
using backend.jobhunter.Application.Workers.Queries;

namespace backend.jobhunter.Application.FunctionalTests.Workers;

public class WorkersTests : TestBase
{
    [Test]
    public async Task ShouldRefuseANonAdministrator()
    {
        await TestApp.RunAsDefaultUserAsync();

        await Should.ThrowAsync<ForbiddenAccessException>(() => TestApp.SendAsync(new GetWorkersOverviewQuery()));
        await Should.ThrowAsync<ForbiddenAccessException>(() => TestApp.SendAsync(new GetWorkerJobsQuery()));
        await Should.ThrowAsync<ForbiddenAccessException>(() => TestApp.SendAsync(new RequeueWorkerJobCommand("1")));
    }

    [Test]
    public async Task ShouldShowTheServerTheQueuesAndThePolls()
    {
        await TestApp.RunAsAdministratorAsync();

        var overview = await TestApp.SendAsync(new GetWorkersOverviewQuery());

        overview.Servers.ShouldNotBeEmpty();
        overview.Recurring.Select(r => r.Id).ShouldContain("cv-generation-poll");
        overview.Recurring.Select(r => r.Id).ShouldContain("profile-import-poll");
        overview.Queues.Select(q => q.Name).ShouldContain("cv-generation");
    }

    [Test]
    public async Task ShouldListJobsByState()
    {
        await TestApp.RunAsAdministratorAsync();

        var failed = await TestApp.SendAsync(new GetWorkerJobsQuery("Failed", 1, 10));
        var succeeded = await TestApp.SendAsync(new GetWorkerJobsQuery("Succeeded", 1, 10));

        failed.ShouldNotBeNull();
        succeeded.ShouldNotBeNull();
    }

    [Test]
    public async Task ShouldReportAMissingJob()
    {
        await TestApp.RunAsAdministratorAsync();

        await Should.ThrowAsync<NotFoundException>(() => TestApp.SendAsync(new GetWorkerJobQuery("999999999")));
        await Should.ThrowAsync<NotFoundException>(() => TestApp.SendAsync(new RequeueWorkerJobCommand("999999999")));
        await Should.ThrowAsync<NotFoundException>(() => TestApp.SendAsync(new TriggerRecurringWorkerJobCommand("nope")));
    }
}
