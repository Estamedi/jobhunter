namespace backend.jobhunter.Domain.Entities;

public class Note : OwnedEntity
{
    public int? ApplicationId { get; set; }
    public string Content { get; set; } = string.Empty;

    public JobApplication? Application { get; set; }
}
