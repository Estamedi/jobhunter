import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { CONTENT_LOCALE, HOME_UPDATED, contentPages } from "@/content/pages";

const SITE_URL = "https://applyladder.com";

// Google ignores changefreq/priority, and ignores lastmod unless it is
// accurate, so only real change dates are listed (see `updated` on each page).
export default function sitemap(): MetadataRoute.Sitemap {
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

  return [...home, ...content];
}
