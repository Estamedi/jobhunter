import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { CONTENT_LOCALE, HOME_UPDATED, contentPages } from "@/content/pages";
import { listCmsArticles } from "@/lib/cms";

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

  const content: MetadataRoute.Sitemap = contentPages.map((page) => ({
    url: `${SITE_URL}/${CONTENT_LOCALE}/${page.slug}`,
    lastModified: page.updated,
  }));

  const blog: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/${CONTENT_LOCALE}/blog`, lastModified: HOME_UPDATED },
  ];

  // Articles written in the CMS: one URL per language, linked to its translations.
  const perLocale = await Promise.all(
    routing.locales.map(async (locale) => ({ locale, articles: await listCmsArticles(locale) })),
  );
  const localesBySlug = new Map<string, string[]>();
  for (const { locale, articles } of perLocale) {
    for (const a of articles) localesBySlug.set(a.slug, [...(localesBySlug.get(a.slug) ?? []), locale]);
  }
  const cms: MetadataRoute.Sitemap = perLocale.flatMap(({ locale, articles }) =>
    articles.map((a) => {
      const locales = localesBySlug.get(a.slug) ?? [locale];
      return {
        url: `${SITE_URL}/${locale}/${a.slug}`,
        lastModified: a.updatedAt ?? a.publishedDate,
        alternates: {
          languages: Object.fromEntries(locales.map((l) => [l, `${SITE_URL}/${l}/${a.slug}`])),
        },
      };
    }),
  );

  return [...home, ...blog, ...content, ...cms];
}
