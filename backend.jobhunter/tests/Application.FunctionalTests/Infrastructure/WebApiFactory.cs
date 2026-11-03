using backend.jobhunter.Application.Common;
using backend.jobhunter.Application.Common.Interfaces;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace backend.jobhunter.Application.FunctionalTests.Infrastructure;

public class WebApiFactory(string connectionString) : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder
            .UseSetting("ConnectionStrings:backend-jobhunterDb", connectionString)
            // Files stay on local disk, so the CV service can be built without an S3 bucket.
            .UseSetting("FileStorage:Provider", "Local");

        builder.ConfigureTestServices(services =>
        {
            // The CV worker runs for real, but against a fake AI and a capturing notifier.
            services.RemoveAll<ICvGenerationAiService>().AddSingleton<ICvGenerationAiService, FakeCvAi>();
            services.RemoveAll<ICvGenerationNotifier>().AddSingleton<ICvGenerationNotifier, CapturingNotifier>();

            services
                .RemoveAll<IUser>()
                .AddTransient(provider =>
                {
                    // Like the real CurrentUser: a user set for background work wins over the test's user.
                    var userOverride = provider.GetRequiredService<UserOverride>();
                    var mock = new Mock<IUser>();
                    mock.SetupGet(x => x.Roles).Returns(TestApp.GetRoles());
                    mock.SetupGet(x => x.Id).Returns(() => userOverride.Id ?? TestApp.GetUserId());
                    return mock.Object;
                });
        });
    }
}
