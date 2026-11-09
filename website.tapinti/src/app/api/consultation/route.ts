import { API_URL } from "@/lib/links";

// The browser posts here instead of to the API directly: the API only allows its own app's origin (CORS).
// A small per-IP limit keeps one visitor from flooding the leads list; the API has its own limit as well.
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 3;
const hits = new Map<string, number[]>();

function tooMany(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) {
    for (const [key, times] of hits) {
      if (times.every((t) => now - t >= WINDOW_MS)) hits.delete(key);
    }
  }
  return recent.length > MAX_PER_WINDOW;
}

const str = (v: unknown, max: number) =>
  typeof v === "string" ? v.trim().slice(0, max) : "";

export async function POST(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (tooMany(ip)) {
    return Response.json({ error: "rate_limited" }, { status: 429 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ error: "invalid" }, { status: 400 });
  }

  const payload = {
    fullName: str(body.fullName, 200),
    email: str(body.email, 256),
    phone: str(body.phone, 50),
    message: str(body.message, 2000),
    locale: str(body.locale, 10),
    website: str(body.website, 200),
  };
  if (!payload.fullName || !payload.email) {
    return Response.json({ error: "invalid" }, { status: 400 });
  }

  try {
    const res = await fetch(`${API_URL}/api/Consultations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
    });
    if (res.status === 400) {
      return Response.json({ error: "invalid" }, { status: 400 });
    }
    if (!res.ok) {
      return Response.json({ error: "failed" }, { status: 502 });
    }
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "failed" }, { status: 502 });
  }
}
