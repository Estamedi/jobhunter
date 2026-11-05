using backend.jobhunter.Application.Common.Interfaces;

namespace backend.jobhunter.Infrastructure.Files;

// With local file storage nothing is uploaded, so there is nothing to wake.
public sealed class NoopCvUploadSignal : ICvUploadSignal
{
    public void Notify() { }
}
