import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { CONTENT_LOCALE, contentPages } from "@/content/pages";

const SITE_URL = "https://applyladder.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  const home: MetadataRoute.Sitemap = routing.locales.map((locale) => ({
    url: `${SITE_URL}/${locale}`,
    lastModified,
    changeFrequency: "weekly",
    priority: locale === routing.defaultLocale ? 1 : 0.8,
    alternates: {
      languages: Object.fromEntries([
        ...routing.locales.map((l) => [l, `${SITE_URL}/${l}`]),
        ["x-default", `${SITE_URL}/${routing.defaultLocale}`],
      ]),
    },
  }));

  const content: MetadataRoute.Sitemap = contentPages.map((page) => ({
    url: `${SITE_URL}/${CONTENT_LOCALE}/${page.slug}`,
    lastModified,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  return [...home, ...content];
}
