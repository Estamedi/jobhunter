namespace backend.jobhunter.Domain.Enums;

// How the candidate knows a skill. Chosen by the candidate. Null on a skill means "not set" and is
// treated like Worked.
public enum SkillEvidenceLevel
{
    // Used in a real job.
    Worked = 0,
    // Used in a personal or school project.
    Project = 1,
    // Studied in a course.
    Course = 2,
    // Currently learning.
    Learning = 3,
    // The candidate lists it as theirs. Written as a normal skill, with no hedging.
    Claimed = 4,
}
