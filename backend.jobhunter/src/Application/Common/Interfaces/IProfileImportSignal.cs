namespace backend.jobhunter.Application.Common.Interfaces;

// Wakes the background worker that reads uploaded CVs.
public interface IProfileImportSignal
{
    void Notify();
}
