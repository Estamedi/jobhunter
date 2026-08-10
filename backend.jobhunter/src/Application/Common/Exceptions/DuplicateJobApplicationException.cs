namespace backend.jobhunter.Application.Common.Exceptions;

public class DuplicateJobApplicationException : Exception
{
    public DuplicateJobApplicationException(int existingJobApplicationId)
        : base("This job has already been saved for this candidate.")
    {
        ExistingJobApplicationId = existingJobApplicationId;
    }

    public int ExistingJobApplicationId { get; }
}
