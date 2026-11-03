namespace backend.jobhunter.Application.Common.Interfaces;

// Wakes the background worker that writes pending CV drafts.
public interface ICvGenerationSignal
{
    void Notify();
}
