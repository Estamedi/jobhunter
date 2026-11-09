import { routing } from "@/i18n/routing";

/**
 * Articles written in the Strapi CMS (../CMS). The website only reads published entries, on the server,
 * and caches them for a minute, so an article shows up without a redeploy. If CMS_URL is not set or the
 * CMS is down, the lists are empty and the built-in pages in content/pages.ts still work.
 */
const CMS_URL = process.env.CMS_URL;
const REVALIDATE_SECONDS = 60;

export type CmsArticle = {
  slug: string;
  locale: string;
  title: string;
  excerpt: string;
  content: string;
  /** Path on this site (the CMS uploads are proxied at /cms-uploads) or an absolute URL. */
  cover?: string;
  youtubeUrl?: string;
  kind: "article" | "video";
  /** YYYY-MM-DD */
  publishedDate?: string;
  updatedAt?: string;
};

type StrapiArticle = {
  slug: string;
  locale?: string;
  title: string;
  excerpt?: string | null;
  content?: string | null;
  cover?: { url?: string } | null;
  youtubeUrl?: string | null;
  kind?: "article" | "video";
  publishedDate?: string | null;
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
    cover: coverUrl(a.cover?.url),
    youtubeUrl: a.youtubeUrl ?? undefined,
    kind: a.kind ?? "article",
    publishedDate: a.publishedDate ?? a.publishedAt?.slice(0, 10) ?? undefined,
    updatedAt: a.updatedAt,
  };
}

async function query(params: Record<string, string>): Promise<StrapiArticle[]> {
  if (!CMS_URL) return [];
  try {
    const url = `${CMS_URL}/api/articles?${new URLSearchParams(params)}`;
    const res = await fetch(url, { next: { revalidate: REVALIDATE_SECONDS } });
    if (!res.ok) return [];
    const body = (await res.json()) as { data?: StrapiArticle[] };
    return body.data ?? [];
  } catch {
    return [];
  }
}

export async function listCmsArticles(locale: string): Promise<CmsArticle[]> {
  const rows = await query({
    locale,
    populate: "cover",
    sort: "publishedDate:desc",
    "pagination[pageSize]": "100",
  });
  return rows.filter((a) => a.slug && a.title).map((a) => toArticle(a, locale));
}

export async function getCmsArticle(locale: string, slug: string): Promise<CmsArticle | null> {
  const rows = await query({
    locale,
    populate: "cover",
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
