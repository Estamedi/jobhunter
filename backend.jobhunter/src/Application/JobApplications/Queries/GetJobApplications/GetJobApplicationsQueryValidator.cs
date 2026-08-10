namespace backend.jobhunter.Application.JobApplications.Queries.GetJobApplications;

public class GetJobApplicationsQueryValidator : AbstractValidator<GetJobApplicationsQuery>
{
    public GetJobApplicationsQueryValidator()
    {
        RuleFor(x => x.Page).GreaterThan(0);
        // Board view intentionally requests up to BOARD_PAGE_SIZE (500) in one page to avoid
        // paginating the Kanban board (see ui.jobhunter applications-board.tsx).
        RuleFor(x => x.PageSize).InclusiveBetween(1, 500);

        RuleFor(x => x)
            .Must(x => !x.SalaryMin.HasValue || !x.SalaryMax.HasValue || x.SalaryMax >= x.SalaryMin)
            .WithMessage("SalaryMax must be greater than or equal to SalaryMin.");

        RuleFor(x => x)
            .Must(x => !x.DateFrom.HasValue || !x.DateTo.HasValue || x.DateTo >= x.DateFrom)
            .WithMessage("DateTo must be greater than or equal to DateFrom.");

        RuleFor(x => x)
            .Must(x => !x.FollowUpFrom.HasValue || !x.FollowUpTo.HasValue || x.FollowUpTo >= x.FollowUpFrom)
            .WithMessage("FollowUpTo must be greater than or equal to FollowUpFrom.");
    }
}
