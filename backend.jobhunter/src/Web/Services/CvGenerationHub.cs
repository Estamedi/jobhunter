using Microsoft.AspNetCore.SignalR;

namespace backend.jobhunter.Web.Services;

// Live updates for CV drafts. The browser only listens: the server pushes "CvDraftChanged" with the draft
// id and status to the draft's owner, and the browser then reads the draft with its own login.
public class CvGenerationHub : Hub
{
    public const string Path = "/hubs/cv-generation";
    public const string ChangedEvent = "CvDraftChanged";
}
