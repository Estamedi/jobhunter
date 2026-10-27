namespace backend.jobhunter.Application.CvDrafts;

public static class CvLimits
{
    // Longest text we send to the AI for one prompt field (background, job description, instructions).
    public const int MaxFieldLength = 20000;
}
