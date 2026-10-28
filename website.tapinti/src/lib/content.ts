import { routing } from "@/i18n/routing";
import { APP_URL, SIGN_UP_URL } from "@/lib/links";
import { CONTENT_LOCALE, contentPages, getContentPage } from "@/content/pages";

export const SITE_URL = "https://applyladder.com";

type Messages = {
  meta: { title: string; description: string };
  hero: { subtitle: string };
  features: {
    title: string;
    subtitle: string;
    items: Record<string, { title: string; desc: string }>;
  };
  connected: {
    title: string;
    subtitle: string;
    nodes: Record<string, string>;
    captions: Record<string, string>;
  };
  pricing: {
    title: string;
    subtitle: string;
    plans: Record<
      string,
      {
        name: string;
        price: string;
        tagline: string;
        features: Record<string, string>;
      }
    >;
  };
  faq: {
    title: string;
    items: Record<string, { q: string; a: string }>;
  };
};

export function isLocale(value: string): value is (typeof routing.locales)[number] {
  return (routing.locales as readonly string[]).includes(value);
}

export async function loadMessages(locale: string): Promise<Messages> {
  const l = isLocale(locale) ? locale : routing.defaultLocale;
  return (await import(`../../messages/${l}.json`)).default;
}

/** Full page content as markdown, for llms-full.txt and the .md mirrors. */
export async function pageMarkdown(locale: string): Promise<string> {
  const m = await loadMessages(locale);
  const out: string[] = [];

  out.push(`# ApplyLadder`, "", `> ${m.meta.description}`, "", m.hero.subtitle, "");

  out.push(`## ${m.features.title}`, "", m.features.subtitle, "");
  for (const f of Object.values(m.features.items)) {
    out.push(`- **${f.title}**: ${f.desc}`);
  }
  out.push("");

  out.push(`## ${m.connected.title}`, "", m.connected.subtitle, "");
  for (const [k, label] of Object.entries(m.connected.nodes)) {
    out.push(`- **${label}**: ${m.connected.captions[k]}`);
  }
  out.push("");

  out.push(`## ${m.pricing.title}`, "", m.pricing.subtitle, "");
  for (const plan of Object.values(m.pricing.plans)) {
    out.push(`### ${plan.name} (${plan.price})`, "", plan.tagline, "");
    for (const feature of Object.values(plan.features)) {
      out.push(`- ${feature}`);
    }
    out.push("");
  }

  out.push(`## ${m.faq.title}`, "");
  for (const item of Object.values(m.faq.items)) {
    out.push(`### ${item.q}`, "", item.a, "");
  }

  out.push(
    "## Links",
    "",
    `- [Sign up](${SIGN_UP_URL})`,
    `- [App](${APP_URL})`,
    `- Contact: support@applyladder.com`,
    "",
  );

  return out.join("\n");
}

/** Short index following the llms.txt convention. */
export async function llmsIndex(): Promise<string> {
  const m = await loadMessages(routing.defaultLocale);
  const lines = [
    "# ApplyLadder",
    "",
    `> ${m.meta.description}`,
    "",
    "ApplyLadder is a web app for job seekers. It replaces spreadsheets and notes with one connected workspace for companies, recruiters, applications, resume versions, interviews and follow-ups. It has a free plan and a paid Pro plan.",
    "",
    "## Pages",
    "",
    ...routing.locales.map(
      (l) =>
        `- [Home (${l})](${SITE_URL}/${l}.md): Product overview, features, pricing and FAQ in markdown`,
    ),
    ...contentPages.map(
      (p) => `- [${p.label}](${SITE_URL}/${CONTENT_LOCALE}/${p.slug}.md): ${p.description}`,
    ),
    "",
    "## Optional",
    "",
    `- [Full content](${SITE_URL}/llms-full.txt): All of the above in a single file`,
    `- [Sign up](${SIGN_UP_URL}): Create a free account`,
    "",
  ];
  return lines.join("\n");
}

/** A content page as markdown, or undefined for an unknown slug. */
export function contentPageMarkdown(slug: string): string | undefined {
  const page = getContentPage(slug);
  if (!page) return undefined;

  const out: string[] = [`# ${page.h1}`, "", `> ${page.description}`, "", page.intro, ""];
  for (const section of page.sections) {
    out.push(`## ${section.heading}`, "", ...section.body.flatMap((p) => [p, ""]));
    if (section.bullets) {
      out.push(...section.bullets.map((b) => `- ${b}`), "");
    }
  }
  if (page.download) {
    out.push(`Download: ${SITE_URL}${page.download.href}`, "");
  }
  out.push("## Frequently asked questions", "");
  for (const f of page.faq) {
    out.push(`### ${f.q}`, "", f.a, "");
  }
  out.push(`Source: ${SITE_URL}/${CONTENT_LOCALE}/${page.slug}`, `Sign up: ${SIGN_UP_URL}`, "");
  return out.join("\n");
}
