import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { CONTENT_LOCALE, HOME_UPDATED } from "@/content/pages";
import { listCmsArticles } from "@/lib/cms";
import { listPages } from "@/lib/pages";

const SITE_URL = "https://applyladder.com";

// Google ignores changefreq/priority, and ignores lastmod unless it is
// accurate, so only real change dates are listed (see `updated` on each page).
export const revalidate = 60;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const home: MetadataRoute.Sitemap = routing.locales.map((locale) => ({
    url: `${SITE_URL}/${locale}`,
    lastModified: HOME_UPDATED,
    alternates: {
      languages: Object.fromEntries([
        ...routing.locales.map((l) => [l, `${SITE_URL}/${l}`]),
        ["x-default", `${SITE_URL}/${routing.defaultLocale}`],
      ]),
    },
  }));

  const blog: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/${CONTENT_LOCALE}/blog`, lastModified: HOME_UPDATED },
  ];

  // English pages (CMS first, built-in copies as fallback) and the articles written in other languages.
  // A slug that exists in more than one language links its translations.
  const perLocale = await Promise.all(
    routing.locales.map(async (locale) => ({ locale, articles: await listCmsArticles(locale) })),
  );
  const localesBySlug = new Map<string, string[]>();
  for (const { locale, articles } of perLocale) {
    for (const a of articles) localesBySlug.set(a.slug, [...(localesBySlug.get(a.slug) ?? []), locale]);
  }
  const entry = (locale: string, slug: string, lastModified?: string) => {
    const locales = localesBySlug.get(slug) ?? [locale];
    return {
      url: `${SITE_URL}/${locale}/${slug}`,
      lastModified: lastModified || undefined,
      ...(locales.length > 1
        ? {
            alternates: {
              languages: Object.fromEntries(locales.map((l) => [l, `${SITE_URL}/${l}/${slug}`])),
            },
          }
        : {}),
    };
  };

  const content: MetadataRoute.Sitemap = (await listPages()).map((p) =>
    entry(CONTENT_LOCALE, p.slug, p.updated),
  );
  const translated: MetadataRoute.Sitemap = perLocale
    .filter(({ locale }) => locale !== CONTENT_LOCALE)
    .flatMap(({ locale, articles }) =>
      articles.map((a) => entry(locale, a.slug, a.updatedDate ?? a.updatedAt)),
    );

  return [...home, ...blog, ...content, ...translated];
}
