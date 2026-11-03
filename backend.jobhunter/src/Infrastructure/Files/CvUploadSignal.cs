using System.Threading.Channels;
using backend.jobhunter.Application.Common.Interfaces;

namespace backend.jobhunter.Infrastructure.Files;

public sealed class CvUploadSignal : ICvUploadSignal
{
    private readonly Channel<bool> _channel = Channel.CreateBounded<bool>(
        new BoundedChannelOptions(1) { FullMode = BoundedChannelFullMode.DropWrite, SingleReader = true });

    public void Notify() => _channel.Writer.TryWrite(true);

    // Completes when notified, or when the poll interval elapses. Returns false on timeout.
    public async Task<bool> WaitAsync(TimeSpan timeout, CancellationToken cancellationToken)
    {
        using var cts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
        cts.CancelAfter(timeout);
        try
        {
            await _channel.Reader.ReadAsync(cts.Token);
            return true;
        }
        catch (OperationCanceledException) when (!cancellationToken.IsCancellationRequested)
        {
            return false;
        }
    }
}
