namespace backend.jobhunter.Application.CvDrafts;

// Where an issue is, so the screen can point at the exact line. Bullet and entry indexes are zero-based;
// Section matches the CV sections ("summary", "experience", "skills", ...).
public record CvScoreLocationDto(string Section, int? EntryIndex, int? BulletIndex, string Text);

public record CvScoreIssueDto(string Message, IReadOnlyList<CvScoreLocationDto> Locations);

public record CvScoreCheckDto(
    string Id, string Title, string Description, int Score, string? Detail, IReadOnlyList<CvScoreIssueDto> Issues);

public record CvScoreDto(int Overall, IReadOnlyList<CvScoreCheckDto> Checks);
