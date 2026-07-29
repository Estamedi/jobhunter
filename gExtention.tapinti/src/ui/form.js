import { $ } from "./dom.js";
import { sourceFromUrl } from "../extraction/basic-extract.js";

export function fillForm(job, pageUrl) {
  $("#f-title").value = job.jobTitle || "";
  $("#f-company").value = job.companyName || "";
  $("#f-country").value = job.country || "";
  $("#f-city").value = job.city || "";
  if (job.workType) $("#f-worktype").value = job.workType;
  if (job.employmentType) $("#f-employment").value = job.employmentType;
  $("#f-salmin").value = job.salaryMin ?? "";
  $("#f-salmax").value = job.salaryMax ?? "";
  $("#f-currency").value = job.currency || "";
  $("#f-link").value = pageUrl || "";
  $("#f-description").value = job.description || "";
  $("#f-requirements").value = job.requirements || "";
}

export function readForm() {
  return {
    candidateId: $("#f-candidate").value,
    jobTitle: $("#f-title").value.trim(),
    companyName: $("#f-company").value.trim(),
    companyWebsite: null,
    country: $("#f-country").value.trim() || null,
    city: $("#f-city").value.trim() || null,
    workType: $("#f-worktype").value,
    employmentType: $("#f-employment").value,
    salaryMin: $("#f-salmin").value ? Number($("#f-salmin").value) : null,
    salaryMax: $("#f-salmax").value ? Number($("#f-salmax").value) : null,
    currency: $("#f-currency").value.trim() || null,
    source: sourceFromUrl($("#f-link").value),
    status: $("#f-status").value,
    priority: $("#f-priority").value,
    jobLink: $("#f-link").value.trim() || null,
    description: $("#f-description").value.trim() || null,
    requirements: $("#f-requirements").value.trim() || null,
    notes: $("#f-notes").value.trim() || null,
  };
}
