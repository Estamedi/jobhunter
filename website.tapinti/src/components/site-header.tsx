"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ButtonLink } from "@/components/ui/button";
import { SIGN_IN_URL, SIGN_UP_URL } from "@/lib/links";
import { cn } from "@/lib/utils";

const SECTIONS = [
  { id: "features", key: "features" },
  { id: "how", key: "howItWorks" },
  { id: "pricing", key: "pricing" },
  { id: "stories", key: "testimonials" },
  { id: "faq", key: "faq" },
] as const;

export function SiteHeader() {
  const t = useTranslations("nav");
  const c = useTranslations("common");
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        scrolled
          ? "border-b border-border bg-background/80 backdrop-blur-xl"
          : "border-b border-transparent",
      )}
    >
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <a href="#top" className="shrink-0" aria-label="Tapinti">
          <Logo />
        </a>

        <ul className="hidden items-center gap-1 md:flex">
          {SECTIONS.map((s) => (
            <li key={s.id}>
              <a
                href={`#${s.id}`}
                className="rounded-full px-3 py-2 text-sm text-foreground/70 transition-colors hover:text-foreground"
              >
                {t(s.key)}
              </a>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          <div className="hidden sm:block">
            <LanguageSwitcher />
          </div>
          <ThemeToggle />
          <a
            href={SIGN_IN_URL}
            className="hidden rounded-full px-3 py-2 text-sm text-foreground/70 transition-colors hover:text-foreground lg:inline-block"
          >
            {t("signIn")}
          </a>
          <ButtonLink
            href={SIGN_UP_URL}
            size="sm"
            className="hidden sm:inline-flex"
          >
            {c("startFree")}
          </ButtonLink>
          <button
            type="button"
            className="inline-grid size-9 place-items-center rounded-full border border-border bg-card/60 md:hidden"
            aria-label={open ? t("closeMenu") : t("openMenu")}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {open && (
        <div className="border-t border-border bg-background/95 backdrop-blur-xl md:hidden">
          <ul className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-4">
            {SECTIONS.map((s) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  onClick={() => setOpen(false)}
                  className="block rounded-lg px-3 py-2.5 text-foreground/80 hover:bg-muted"
                >
                  {t(s.key)}
                </a>
              </li>
            ))}
            <li className="mt-2 flex items-center justify-between gap-2">
              <LanguageSwitcher />
              <ButtonLink href={SIGN_UP_URL} size="sm" className="flex-1">
                {c("startFree")}
              </ButtonLink>
            </li>
          </ul>
        </div>
      )}
    </header>
  );
}
