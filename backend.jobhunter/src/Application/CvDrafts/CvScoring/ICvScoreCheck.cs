using backend.jobhunter.Application.Common.Interfaces;

namespace backend.jobhunter.Application.CvDrafts;

// One thing the CV score looks at. To add a check, write a class that implements this and list it in
// CvScorer; nothing else needs to change.
internal interface ICvScoreCheck
{
    // Share of the overall score. The weights of all checks add up to 100.
    int Weight { get; }

    // Scores the CV 0 to 10 and lists what cost points, with the lines responsible.
    CvScoreCheckDto Run(GeneratedCvDto cv);
}
