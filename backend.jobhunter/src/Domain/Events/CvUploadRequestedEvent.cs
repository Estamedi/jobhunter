namespace backend.jobhunter.Domain.Events;

public class CvUploadRequestedEvent(Cv cv) : BaseEvent
{
    public Cv Cv { get; } = cv;
}
