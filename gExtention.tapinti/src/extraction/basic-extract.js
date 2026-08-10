export function sourceFromUrl(url) {
  try {
    const host = new URL(url).hostname;
    if (host.includes("linkedin")) return "LinkedIn";
    if (host.includes("indeed")) return "Indeed";
    if (host.includes("glassdoor")) return "Glassdoor";
    return host.replace(/^www\./, "");
  } catch {
    return "Other";
  }
}

// Fallback when no Anthropic key is configured or the AI call fails.
export function basicExtract(page) {
  const jp = page.jsonLd || {};
  const addr = [].concat(jp.jobLocation || [])[0]?.address || {};
  const salary = jp.baseSalary?.value || {};
  const remote = /remote/i.test(jp.jobLocationType || "") ||
    /\bremote\b/i.test(page.text.slice(0, 2000));
  const stripHtml = (s) =>
    typeof s === "string" ? s.replace(/<[^>]+>/g, " ").replace(/\s{2,}/g, " ").trim() : null;

  // "Senior Engineer - Acme | LinkedIn" style titles as a last resort
  const titleParts = page.title.split(/\s[-|–]\s/);

  return {
    jobTitle: jp.title || titleParts[0]?.trim() || null,
    companyName: jp.hiringOrganization?.name || titleParts[1]?.trim() || null,
    companyWebsite: jp.hiringOrganization?.sameAs || null,
    country: addr.addressCountry || null,
    city: addr.addressLocality || null,
    workType: remote ? "Remote" : "Onsite",
    employmentType: /part.?time/i.test(jp.employmentType || "") ? "PartTime"
      : /contract/i.test(jp.employmentType || "") ? "Contract"
      : /intern/i.test(jp.employmentType || "") ? "Internship"
      : "FullTime",
    salaryMin: salary.minValue ?? null,
    salaryMax: salary.maxValue ?? null,
    currency: jp.baseSalary?.currency || null,
    source: new URL(page.url).hostname.replace(/^www\./, ""),
    description: stripHtml(jp.description)?.slice(0, 2000) || null,
    requirements: null,
  };
}
