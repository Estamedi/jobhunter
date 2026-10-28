import { useLocale, useTranslations } from "next-intl";
import { APP_URL } from "@/lib/links";
import { Link } from "@/i18n/navigation";
import { Logo } from "@/components/logo";
import { contentPages } from "@/content/pages";

const columns = [
  {
    heading: "product",
    links: ["features", "pricing"],
  },
  {
    heading: "company",
    links: ["contact"],
  },
  {
    heading: "legal",
    links: ["privacy", "terms"],
  },
] as const;

const internalHrefs: Record<string, string> = {
  features: "/#features",
  pricing: "/#pricing",
};

const linkHrefs: Record<string, string> = {
  contact: "mailto:support@applyladder.com",
  privacy: `${APP_URL}/privacy`,
  terms: `${APP_URL}/terms`,
};

export function SiteFooter() {
  const t = useTranslations("footer");
  const locale = useLocale();
  const year = 2026;

  return (
    <footer className="border-t border-border bg-background-subtle">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div className="max-w-xs">
            <Logo />
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              {t("tagline")}
            </p>
          </div>

          {columns.map((col) => (
            <div key={col.heading}>
              <h3 className="text-sm font-semibold">{t(col.heading)}</h3>
              <ul className="mt-4 space-y-3">
                {col.links.map((link) => (
                  <li key={link}>
                    {internalHrefs[link] ? (
                      <Link
                        href={internalHrefs[link]}
                        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {t(`links.${link}`)}
                      </Link>
                    ) : (
                      <a
                        href={linkHrefs[link]}
                        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {t(`links.${link}`)}
                      </a>
                    )}
                  </li>
                ))}
                {col.heading === "product" &&
                  locale === "en" &&
                  contentPages.map((p) => (
                    <li key={p.slug}>
                      <Link
                        href={`/${p.slug}`}
                        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {p.label}
                      </Link>
                    </li>
                  ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 text-sm text-muted-foreground sm:flex-row">
          <p>© {year} ApplyLadder. {t("rights")}</p>
          <p className="text-center italic">{t("builtWith")}</p>
        </div>
      </div>
    </footer>
  );
}
