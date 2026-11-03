namespace backend.jobhunter.Application.Common.Interfaces;

// Wakes the background worker that uploads pending CV files to remote storage.
public interface ICvUploadSignal
{
    void Notify();
}
