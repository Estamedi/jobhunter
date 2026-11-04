namespace backend.jobhunter.Application.CvDrafts;

public static class CvLimits
{
    // Longest text we send to the AI for one prompt field (background, job description, instructions).
    public const int MaxFieldLength = 20000;

    // Most skill items a generated CV keeps in total (the prompt asks for 12 to 18).
    public const int MaxSkillItems = 20;
}
