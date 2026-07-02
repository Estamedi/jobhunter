import { defineRouting } from "next-intl/routing";

export const locales = ["en", "fa", "ar"] as const;
export type Locale = (typeof locales)[number];

export const rtlLocales: Locale[] = ["fa", "ar"];

export const routing = defineRouting({
  locales,
  defaultLocale: "en",
  localePrefix: "always",
});
