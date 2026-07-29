// Injected into the page via chrome.scripting.executeScript — must be
// self-contained (Chrome serializes it, so it can't close over module scope).
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

export async function readActiveTab() {
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
