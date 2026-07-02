import { useTranslations } from "next-intl";
import { Logo } from "@/components/logo";
import { GithubIcon, LinkedinIcon, XIcon } from "@/components/brand-icons";

const columns = [
  {
    heading: "product",
    links: ["features", "pricing", "roadmap", "blog"],
  },
  {
    heading: "company",
    links: ["about", "contact"],
  },
  {
    heading: "legal",
    links: ["privacy", "terms"],
  },
] as const;

const linkHrefs: Record<string, string> = {
  features: "#features",
  pricing: "#pricing",
};

const socials = [
  { key: "github", icon: GithubIcon, href: "https://github.com" },
  { key: "linkedin", icon: LinkedinIcon, href: "https://linkedin.com" },
  { key: "twitter", icon: XIcon, href: "https://twitter.com" },
] as const;

export function SiteFooter() {
  const t = useTranslations("footer");
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
            <div className="mt-6 flex gap-2">
              {socials.map((s) => {
                const Icon = s.icon;
                return (
                  <a
                    key={s.key}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={t(`links.${s.key}`)}
                    className="grid size-9 place-items-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <Icon className="size-4" />
                  </a>
                );
              })}
            </div>
          </div>

          {columns.map((col) => (
            <div key={col.heading}>
              <h3 className="text-sm font-semibold">{t(col.heading)}</h3>
              <ul className="mt-4 space-y-3">
                {col.links.map((link) => (
                  <li key={link}>
                    <a
                      href={linkHrefs[link] ?? "#top"}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {t(`links.${link}`)}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 text-sm text-muted-foreground sm:flex-row">
          <p>© {year} Tapinti. {t("rights")}</p>
          <p className="text-center italic">{t("builtWith")}</p>
        </div>
      </div>
    </footer>
  );
}
