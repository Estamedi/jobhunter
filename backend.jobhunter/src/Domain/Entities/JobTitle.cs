namespace backend.jobhunter.Domain.Entities;

public class JobTitle : BaseAuditableEntity
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }

    public ICollection<JobRole> JobRoles { get; set; } = new List<JobRole>();
}
