import { routing } from "@/i18n/routing";

/**
 * Articles written in the Strapi CMS (../CMS). The website only reads published entries, on the server,
 * and caches them for a minute, so an article shows up without a redeploy. If CMS_URL is not set the lists
 * are empty (this is the case during `next build`). If the CMS cannot be reached the functions throw, so
 * Next keeps serving the last good copy of a page instead of caching an error or a 404.
 */
const CMS_URL = process.env.CMS_URL;
const REVALIDATE_SECONDS = 60;

export class CmsUnavailableError extends Error {}

export type CmsArticle = {
  slug: string;
  locale: string;
  title: string;
  excerpt: string;
  content: string;
  seoTitle?: string;
  seoDescription?: string;
  label?: string;
  faq: { q: string; a: string }[];
  /** Slugs of related pages. */
  related: string[];
  download?: { href: string; label: string };
  externalCta?: { href: string; label: string };
  /** Path on this site (the CMS uploads are proxied at /cms-uploads) or an absolute URL. */
  cover?: string;
  youtubeUrl?: string;
  kind: "article" | "video";
  /** YYYY-MM-DD */
  publishedDate?: string;
  /** YYYY-MM-DD: the date the content really changed (sitemap lastmod). */
  updatedDate?: string;
  updatedAt?: string;
};

type StrapiArticle = {
  slug: string;
  locale?: string;
  title: string;
  excerpt?: string | null;
  content?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  label?: string | null;
  faq?: { q?: string | null; a?: string | null }[] | null;
  relatedSlugs?: string | null;
  downloadHref?: string | null;
  downloadLabel?: string | null;
  externalCtaHref?: string | null;
  externalCtaLabel?: string | null;
  cover?: { url?: string } | null;
  youtubeUrl?: string | null;
  kind?: "article" | "video";
  publishedDate?: string | null;
  updatedDate?: string | null;
  publishedAt?: string | null;
  updatedAt?: string;
};

function coverUrl(url?: string): string | undefined {
  if (!url) return undefined;
  return url.startsWith("/uploads/") ? `/cms-uploads/${url.slice("/uploads/".length)}` : url;
}

function toArticle(a: StrapiArticle, locale: string): CmsArticle {
  return {
    slug: a.slug,
    locale: a.locale ?? locale,
    title: a.title,
    excerpt: a.excerpt ?? "",
    content: a.content ?? "",
    seoTitle: a.seoTitle || undefined,
    seoDescription: a.seoDescription || undefined,
    label: a.label || undefined,
    faq: (a.faq ?? []).filter((f) => f.q && f.a).map((f) => ({ q: f.q!, a: f.a! })),
    related: (a.relatedSlugs ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    download: a.downloadHref
      ? { href: a.downloadHref, label: a.downloadLabel ?? a.downloadHref }
      : undefined,
    externalCta: a.externalCtaHref
      ? { href: a.externalCtaHref, label: a.externalCtaLabel ?? a.externalCtaHref }
      : undefined,
    cover: coverUrl(a.cover?.url),
    youtubeUrl: a.youtubeUrl ?? undefined,
    kind: a.kind ?? "article",
    publishedDate: a.publishedDate ?? a.publishedAt?.slice(0, 10) ?? undefined,
    updatedDate: a.updatedDate ?? undefined,
    updatedAt: a.updatedAt,
  };
}

async function query(params: Record<string, string>): Promise<StrapiArticle[]> {
  if (!CMS_URL) return [];
  let res: Response;
  try {
    const url = `${CMS_URL}/api/articles?${new URLSearchParams(params)}`;
    res = await fetch(url, { next: { revalidate: REVALIDATE_SECONDS } });
  } catch (e) {
    throw new CmsUnavailableError(`CMS request failed: ${String(e)}`);
  }
  if (!res.ok) throw new CmsUnavailableError(`CMS answered ${res.status}`);
  const body = (await res.json()) as { data?: StrapiArticle[] };
  return body.data ?? [];
}

export async function listCmsArticles(locale: string): Promise<CmsArticle[]> {
  const rows = await query({
    locale,
    "populate[0]": "cover",
    "populate[1]": "faq",
    sort: "publishedDate:desc",
    "pagination[pageSize]": "100",
  });
  return rows.filter((a) => a.slug && a.title).map((a) => toArticle(a, locale));
}

export async function getCmsArticle(locale: string, slug: string): Promise<CmsArticle | null> {
  const rows = await query({
    locale,
    "populate[0]": "cover",
    "populate[1]": "faq",
    "filters[slug][$eq]": slug,
    "pagination[pageSize]": "1",
  });
  const row = rows.find((a) => a.slug === slug);
  return row ? toArticle(row, locale) : null;
}

/** The locales that have a published version of this slug, for hreflang. */
export async function cmsArticleLocales(slug: string): Promise<string[]> {
  const found = await Promise.all(
    routing.locales.map(async (l) => ((await getCmsArticle(l, slug)) ? l : null)),
  );
  return found.filter((l): l is (typeof routing.locales)[number] => l !== null);
}
