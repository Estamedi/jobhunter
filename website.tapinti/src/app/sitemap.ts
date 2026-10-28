import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";

const SITE_URL = "https://applyladder.com";

export default function sitemap(): MetadataRoute.Sitemap {
  return routing.locales.map((locale) => ({
    url: `${SITE_URL}/${locale}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: locale === routing.defaultLocale ? 1 : 0.8,
    alternates: {
      languages: Object.fromEntries(
        [
          ...routing.locales.map((l) => [l, `${SITE_URL}/${l}`]),
          ["x-default", `${SITE_URL}/${routing.defaultLocale}`],
        ],
      ),
    },
  }));
}
