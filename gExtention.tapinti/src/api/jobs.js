import { api } from "./client.js";
import { settings } from "../settings.js";
import { getCurrentUser, isJobSeeker } from "./users.js";
import { $ } from "../ui/dom.js";

export async function findOrCreateCompany(job) {
  const name = job.companyName.trim();
  const found = await api(
    `/api/Companies?search=${encodeURIComponent(name)}&pageSize=50`,
  );
  const match = found.items.find(
    (c) => c.name.toLowerCase() === name.toLowerCase(),
  );
  if (match) return match.id;
  return api("/api/Companies", {
    method: "POST",
    body: JSON.stringify({
      name,
      website: job.companyWebsite || null,
      country: job.country || null,
      city: job.city || null,
    }),
  });
}

export async function saveJob(job) {
  const companyId = await findOrCreateCompany(job);

  const jobRoleId = await api("/api/job-roles", {
    method: "POST",
    body: JSON.stringify({
      companyId,
      title: job.jobTitle,
      jobLink: job.jobLink || null,
      source: job.source || "Other",
      country: job.country || null,
      city: job.city || null,
      workType: job.workType || "Remote",
      salaryMin: job.salaryMin ?? null,
      salaryMax: job.salaryMax ?? null,
      currency: job.currency || null,
      employmentType: job.employmentType || "FullTime",
      description: job.description || null,
      requirements: job.requirements || null,
    }),
  });

  const applicationId = await api("/api/applications", {
    method: "POST",
    body: JSON.stringify({
      candidateId: Number(job.candidateId),
      jobRoleId,
      companyId,
      status: job.status,
      priority: job.priority,
      appliedDate: job.status === "Applied" ? new Date().toISOString() : null,
      currency: job.currency || null,
      notes: job.notes || null,
    }),
  });

  return { companyId, jobRoleId, applicationId };
}

// A JobSeeker always manages exactly their own Candidate profile (auto-created
// by the backend), so the picker only matters for Recruiter/Administrator
// accounts juggling multiple candidates — see isJobSeeker().
export async function loadCandidates() {
  const [user, data] = await Promise.all([
    getCurrentUser(),
    api("/api/Candidates?isActive=true&pageSize=50"),
  ]);
  const jobSeeker = isJobSeeker(user);

  const select = $("#f-candidate");
  select.innerHTML = "";
  for (const c of data.items) {
    const opt = document.createElement("option");
    opt.value = c.id;
    opt.textContent = c.fullName;
    select.appendChild(opt);
  }
  if (settings.candidateId &&
      data.items.some((c) => String(c.id) === String(settings.candidateId))) {
    select.value = settings.candidateId;
  }

  $("#f-candidate-field").classList.toggle("hidden", jobSeeker);

  if (!data.items.length) {
    throw new Error("No candidates found in the portal — create one first.");
  }
}
