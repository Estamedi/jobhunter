/* Tapinti Job Saver — popup entry point
 *
 * Flow: read the active tab -> extract structured job data (Claude or OpenAI,
 * whichever is configured, with a JSON-LD/heuristic fallback) -> save to the
 * Tapinti portal: find/create Company -> create JobRole -> create JobApplication.
 *
 * This file only wires DOM events and orchestrates the main/save flows; the
 * actual logic lives in the modules under settings.js / api/ / extraction/ / ui/.
 */

import { $ } from "./ui/dom.js";
import { show, setError } from "./ui/views.js";
import { DEFAULT_API_BASE, settings, loadSettings, saveSettings } from "./settings.js";
import { login, loginWithGoogle } from "./api/auth.js";
import { resetCurrentUser } from "./api/users.js";
import { loadCandidates, saveJob } from "./api/jobs.js";
import { readActiveTab } from "./extraction/page-reader.js";
import { extractJob } from "./extraction/extract-job.js";
import { fillForm, readForm } from "./ui/form.js";

async function startMainFlow() {
  show("main");
  setError("#main-error", null);
  $("#main-success").classList.add("hidden");
  const status = $("#extract-status");

  try {
    status.textContent = "Reading page…";
    status.classList.remove("hidden");
    const [page] = await Promise.all([readActiveTab(), loadCandidates()]);

    const job = await extractJob(page, {
      status,
      onFallback: (err) =>
        setError("#main-error", `AI extraction failed, used basic parsing instead.\n${err.message}`),
    });
    console.log("Extracted job:", job);

    fillForm(job, page.url);
    status.classList.add("hidden");
    $("#job-form").classList.remove("hidden");
  } catch (err) {
    status.classList.add("hidden");
    setError("#main-error", err.message);
  }
}

async function onSubmit(e) {
  e.preventDefault();
  setError("#main-error", null);
  const btn = $("#btn-save");
  btn.disabled = true;
  btn.textContent = "Saving…";

  const job = readForm();
  try {
    if (!job.jobTitle || !job.companyName) {
      throw new Error("Job title and company are required.");
    }
    await saveSettings({ candidateId: job.candidateId });
    const ids = await saveJob(job);
    $("#main-success").textContent =
      `Saved! Application #${ids.applicationId} (${job.companyName} — ${job.jobTitle})`;
    $("#main-success").classList.remove("hidden");
    $("#job-form").classList.add("hidden");
  } catch (err) {
    if (err.status === 409) {
      $("#main-success").textContent = `You've already saved this job (${job.companyName} — ${job.jobTitle}).`;
      $("#main-success").classList.remove("hidden");
      $("#job-form").classList.add("hidden");
    } else {
      setError("#main-error", err.message);
    }
  } finally {
    btn.disabled = false;
    btn.textContent = "Save to portal";
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  await loadSettings();

  $("#btn-login").addEventListener("click", async () => {
    setError("#login-error", null);
    try {
      await login($("#login-email").value.trim(), $("#login-password").value);
      startMainFlow();
    } catch (err) {
      setError("#login-error", err.message);
    }
  });
  $("#login-password").addEventListener("keydown", (e) => {
    if (e.key === "Enter") $("#btn-login").click();
  });

  $("#btn-toggle-password").addEventListener("click", () => {
    const input = $("#login-password");
    const showing = input.type === "text";
    input.type = showing ? "password" : "text";
    $("#btn-toggle-password .eye-icon").classList.toggle("hidden", showing);
    $("#btn-toggle-password .eye-off-icon").classList.toggle("hidden", !showing);
    $("#btn-toggle-password").title = showing ? "Show password" : "Hide password";
    $("#btn-toggle-password").setAttribute(
      "aria-label",
      showing ? "Show password" : "Hide password",
    );
  });

  $("#btn-google-login").addEventListener("click", async () => {
    setError("#login-error", null);
    const btn = $("#btn-google-login");
    btn.disabled = true;
    try {
      await loginWithGoogle();
      startMainFlow();
    } catch (err) {
      setError("#login-error", err.message);
    } finally {
      btn.disabled = false;
    }
  });

  $("#btn-settings").addEventListener("click", () => {
    $("#set-api-base").value = settings.apiBaseUrl;
    $("#set-google-client-id").value = settings.googleClientId || "";
    $("#set-restrict-job-sites").checked = settings.restrictToJobSites;
    $("#redirect-uri-hint").textContent = chrome.identity.getRedirectURL();
    show("settings");
  });

  $("#btn-save-settings").addEventListener("click", async () => {
    await saveSettings({
      apiBaseUrl: ($("#set-api-base").value.trim() || DEFAULT_API_BASE).replace(/\/+$/, ""),
      googleClientId: $("#set-google-client-id").value.trim() || null,
      restrictToJobSites: $("#set-restrict-job-sites").checked,
    });
    settings.accessToken ? startMainFlow() : show("login");
  });

  $("#btn-logout").addEventListener("click", async () => {
    resetCurrentUser();
    await saveSettings({ accessToken: null, refreshToken: null });
    show("login");
  });

  $("#job-form").addEventListener("submit", onSubmit);

  settings.accessToken ? startMainFlow() : show("login");
});
