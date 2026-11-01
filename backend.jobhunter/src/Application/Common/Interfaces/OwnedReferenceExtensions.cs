using backend.jobhunter.Application.Common.Exceptions;

namespace backend.jobhunter.Application.Common.Interfaces;

/// <summary>
/// The per-owner query filter hides other users' rows on read, but a foreign key written from a
/// request body is never read back, so ids supplied by the client must be checked explicitly.
/// Each id is looked up through the filtered DbSet, so only the caller's own rows count.
/// </summary>
public static class OwnedReferenceExtensions
{
    public static async Task EnsureOwnedReferencesAsync(
        this IApplicationDbContext context,
        CancellationToken cancellationToken,
        int? candidateId = null,
        int? companyId = null,
        int? contactId = null,
        int? jobRoleId = null,
        int? applicationId = null,
        int? cvId = null)
    {
        if (candidateId is int candidate && !await context.Candidates.AnyAsync(e => e.Id == candidate, cancellationToken))
            throw new NotFoundException("Candidate", candidate);

        if (companyId is int company && !await context.Companies.AnyAsync(e => e.Id == company, cancellationToken))
            throw new NotFoundException("Company", company);

        if (contactId is int contact && !await context.Contacts.AnyAsync(e => e.Id == contact, cancellationToken))
            throw new NotFoundException("Contact", contact);

        if (jobRoleId is int role && !await context.JobRoles.AnyAsync(e => e.Id == role, cancellationToken))
            throw new NotFoundException("JobRole", role);

        if (applicationId is int application && !await context.Applications.AnyAsync(e => e.Id == application, cancellationToken))
            throw new NotFoundException("JobApplication", application);

        if (cvId is int cv && !await context.Cvs.AnyAsync(e => e.Id == cv, cancellationToken))
            throw new NotFoundException("Cv", cv);
    }
}
