using backend.jobhunter.Application.Common.Interfaces;
using backend.jobhunter.Application.Common.Models;
using backend.jobhunter.Application.Common.Security;
using backend.jobhunter.Domain.Constants;

namespace backend.jobhunter.Application.Users.Queries.GetUsers;

[Authorize(Roles = Roles.Administrator)]
public record GetUsersQuery(
    string? Search = null,
    string? Role = null,
    int Page = 1,
    int PageSize = 20) : IRequest<RegisteredUsersResult>;

public class GetUsersQueryValidator : AbstractValidator<GetUsersQuery>
{
    public GetUsersQueryValidator()
    {
        RuleFor(x => x.Page).GreaterThanOrEqualTo(1);
        RuleFor(x => x.PageSize).InclusiveBetween(1, 100);
    }
}

public class GetUsersQueryHandler(IIdentityService identityService)
    : IRequestHandler<GetUsersQuery, RegisteredUsersResult>
{
    public Task<RegisteredUsersResult> Handle(GetUsersQuery request, CancellationToken cancellationToken)
        => identityService.GetUsersAsync(request.Search, request.Role, request.Page, request.PageSize, cancellationToken);
}
