/* Tapinti Job Saver
 *
 * Flow: read the active tab -> extract structured job data (Claude API, with a
 * JSON-LD fallback) -> save to the Tapinti portal:
 *   find/create Company -> create JobRole -> create JobApplication.
 */

const DEFAULT_API_BASE = "https://api.tapinti.com";
const $ = (sel) => document.querySelector(sel);

let settings = {
  apiBaseUrl: DEFAULT_API_BASE,
  accessToken: null,
  refreshToken: null,
  anthropicKey: null,
  googleClientId: null,
  candidateId: null,
};

// ---------------------------------------------------------------- views

function show(view) {
  for (const v of ["login", "settings", "main"]) {
    $(`#view-${v}`).classList.toggle("hidden", v !== view);
  }
}

function setError(id, msg) {
  const el = $(id);
  el.textContent = msg || "";
  el.classList.toggle("hidden", !msg);
}

// ---------------------------------------------------------------- storage

async function loadSettings() {
  const stored = await chrome.storage.local.get(Object.keys(settings));
  settings = { ...settings, ...stored };
  if (!settings.apiBaseUrl) settings.apiBaseUrl = DEFAULT_API_BASE;
}

async function saveSettings(patch) {
  settings = { ...settings, ...patch };
  await chrome.storage.local.set(patch);
}

// ---------------------------------------------------------------- portal API

async function api(path, options = {}, allowRetry = true) {
  const res = await fetch(settings.apiBaseUrl + path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(settings.accessToken
        ? { Authorization: `Bearer ${settings.accessToken}` }
        : {}),
      ...options.headers,
    },
  });

  if (res.status === 401 && allowRetry && settings.refreshToken) {
    const refreshed = await tryRefreshToken();
    if (refreshed) return api(path, options, false);
  }
  if (res.status === 401) {
    show("login");
    throw new Error("Session expired — please sign in again.");
  }
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Portal API ${res.status} on ${path}\n${body.slice(0, 300)}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

async function tryRefreshToken() {
  try {
    const res = await fetch(`${settings.apiBaseUrl}/api/Users/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: settings.refreshToken }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    await saveSettings({
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
    });
    return true;
  } catch {
    return false;
  }
}

async function login(email, password) {
  const res = await fetch(
    `${settings.apiBaseUrl}/api/Users/login?useCookies=false&useSessionCookies=false`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    },
  );
  if (!res.ok) throw new Error("Login failed — check email and password.");
  const data = await res.json();
  await saveSettings({
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
  });
}

// ---------------------------------------------------------------- Google sign-in

// MV3 extensions can't rely on Google Identity Services' popup-based token
// client — the extension popup loses focus (and closes) as soon as the
// auth popup opens. chrome.identity.launchWebAuthFlow is the flow Chrome
// actually supports for this: it drives the OAuth redirect in a window
// Chrome controls itself, so it survives the extension popup closing.
function getGoogleAccessToken() {
  if (!settings.googleClientId) {
    return Promise.reject(
      new Error('Set a Google client ID in Settings first, then try "Continue with Google" again.'),
    );
  }

  const redirectUri = chrome.identity.getRedirectURL();
  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authUrl.searchParams.set("client_id", settings.googleClientId);
  authUrl.searchParams.set("response_type", "token");
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("scope", "openid email profile");
  authUrl.searchParams.set("prompt", "select_account");

  return new Promise((resolve, reject) => {
    chrome.identity.launchWebAuthFlow(
      { url: authUrl.toString(), interactive: true },
      (redirectedTo) => {
        if (chrome.runtime.lastError || !redirectedTo) {
          reject(new Error(chrome.runtime.lastError?.message || "Google sign-in was cancelled."));
          return;
        }
        const params = new URLSearchParams(new URL(redirectedTo).hash.slice(1));
        const accessToken = params.get("access_token");
        if (params.get("error")) {
          reject(new Error(`Google sign-in failed: ${params.get("error")}`));
        } else if (!accessToken) {
          reject(new Error("Google did not return an access token."));
        } else {
          resolve(accessToken);
        }
      },
    );
  });
}

async function loginWithGoogle() {
  const accessToken = await getGoogleAccessToken();
  const res = await fetch(`${settings.apiBaseUrl}/api/Users/google-login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken: accessToken }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Google sign-in failed (${res.status}).\n${body.slice(0, 300)}`);
  }
  const data = await res.json();
  await saveSettings({
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
  });
}

// ---------------------------------------------------------------- page extraction

// Injected into the page — must be self-contained.
function grabPage() {
  const out = { url: location.href, title: document.title, jsonLd: null, text: "" };
  for (const s of document.querySelectorAll('script[type="application/ld+json"]')) {
    try {
      const data = JSON.parse(s.textContent);
      const items = Array.isArray(data) ? data : data["@graph"] || [data];
      const jp = items.find((i) => {
        const t = i && i["@type"];
        return t === "JobPosting" || (Array.isArray(t) && t.includes("JobPosting"));
      });
      if (jp) { out.jsonLd = jp; break; }
    } catch { /* ignore malformed blocks */ }
  }
  out.text = (document.body?.innerText || "")
    .replace(/\n{3,}/g, "\n\n")
    .slice(0, 50000);
  return out;
}

async function readActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id || /^(chrome|edge|about|chrome-extension):/.test(tab.url || "")) {
    throw new Error("This page can't be read. Open a job posting and try again.");
  }
  const [{ result }] = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: grabPage,
  });
  return result;
}

// ---------------------------------------------------------------- AI extraction

const JOB_SCHEMA = {
  type: "object",
  properties: {
    jobTitle: { type: ["string", "null"], description: "The job position title" },
    companyName: { type: ["string", "null"], description: "The hiring company name" },
    companyWebsite: { type: ["string", "null"] },
    country: { type: ["string", "null"] },
    city: { type: ["string", "null"] },
    workType: { type: ["string", "null"], enum: ["Remote", "Hybrid", "Onsite", null] },
    employmentType: {
      type: ["string", "null"],
      enum: ["FullTime", "PartTime", "Contract", "Internship", null],
    },
    salaryMin: { type: ["number", "null"] },
    salaryMax: { type: ["number", "null"] },
    currency: { type: ["string", "null"], description: "ISO currency code, e.g. USD" },
    source: {
      type: ["string", "null"],
      description: "Job board name, e.g. LinkedIn, Indeed, or CompanyWebsite",
    },
    description: {
      type: ["string", "null"],
      description: "Concise summary of the role (max ~150 words)",
    },
    requirements: {
      type: ["string", "null"],
      description: "Key requirements as a short bullet list",
    },
  },
  required: [
    "jobTitle", "companyName", "companyWebsite", "country", "city", "workType",
    "employmentType", "salaryMin", "salaryMax", "currency", "source",
    "description", "requirements",
  ],
  additionalProperties: false,
};

async function aiExtract(page) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": settings.anthropicKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: "claude-opus-4-8",
      max_tokens: 4096,
      thinking: { type: "adaptive" },
      output_config: { format: { type: "json_schema", schema: JOB_SCHEMA } },
      messages: [
        {
          role: "user",
          content:
            "Extract the job posting details from this web page. " +
            "If the page is not a job posting, set every field to null.\n\n" +
            `Page URL: ${page.url}\nPage title: ${page.title}\n\n` +
            (page.jsonLd
              ? `Structured data found on the page:\n${JSON.stringify(page.jsonLd).slice(0, 8000)}\n\n`
              : "") +
            `Page text:\n${page.text}`,
        },
      ],
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Claude API ${res.status}\n${body.slice(0, 300)}`);
  }
  const msg = await res.json();
  if (msg.stop_reason === "refusal") {
    throw new Error("The AI declined to process this page.");
  }
  const text = msg.content.find((b) => b.type === "text")?.text;
  if (!text) throw new Error("Empty AI response.");
  return JSON.parse(text);
}

// Fallback when no Anthropic key is configured or the AI call fails.
function basicExtract(page) {
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

// ---------------------------------------------------------------- save flow

async function findOrCreateCompany(job) {
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

async function saveJob(job) {
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

// ---------------------------------------------------------------- form helpers

function fillForm(job, pageUrl) {
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

function readForm() {
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

function sourceFromUrl(url) {
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

async function loadCandidates() {
  const data = await api("/api/Candidates?isActive=true&pageSize=50");
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
  if (!data.items.length) {
    throw new Error("No candidates found in the portal — create one first.");
  }
}

// ---------------------------------------------------------------- main flow

async function startMainFlow() {
  show("main");
  setError("#main-error", null);
  $("#main-success").classList.add("hidden");
  const status = $("#extract-status");

  try {
    status.textContent = "Reading page…";
    status.classList.remove("hidden");
    const [page] = await Promise.all([readActiveTab(), loadCandidates()]);

    let job;
    if (settings.anthropicKey) {
      status.textContent = "Extracting job details with AI…";
      try {
        job = await aiExtract(page);
      } catch (err) {
        console.warn("AI extraction failed, using basic parser:", err);
        job = basicExtract(page);
        setError("#main-error", `AI extraction failed, used basic parsing instead.\n${err.message}`);
      }
    } else {
      job = basicExtract(page);
    }

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

  try {
    const job = readForm();
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
    setError("#main-error", err.message);
  } finally {
    btn.disabled = false;
    btn.textContent = "Save to portal";
  }
}

// ---------------------------------------------------------------- wiring

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
    $("#set-anthropic-key").value = settings.anthropicKey || "";
    $("#set-google-client-id").value = settings.googleClientId || "";
    $("#redirect-uri-hint").textContent = chrome.identity.getRedirectURL();
    show("settings");
  });

  $("#btn-save-settings").addEventListener("click", async () => {
    await saveSettings({
      apiBaseUrl: ($("#set-api-base").value.trim() || DEFAULT_API_BASE).replace(/\/+$/, ""),
      anthropicKey: $("#set-anthropic-key").value.trim() || null,
      googleClientId: $("#set-google-client-id").value.trim() || null,
    });
    settings.accessToken ? startMainFlow() : show("login");
  });

  $("#btn-logout").addEventListener("click", async () => {
    await saveSettings({ accessToken: null, refreshToken: null });
    show("login");
  });

  $("#job-form").addEventListener("submit", onSubmit);

  settings.accessToken ? startMainFlow() : show("login");
});
