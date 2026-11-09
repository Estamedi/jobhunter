"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Menu, MessageCircle, Puzzle, X } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ButtonLink } from "@/components/ui/button";
import { CHROME_EXTENSION_URL, SIGN_IN_URL } from "@/lib/links";
import { cn } from "@/lib/utils";

const SECTIONS = [
  { id: "features", key: "features" },
  { id: "how", key: "howItWorks" },
  { id: "pricing", key: "pricing" },
] as const;

const PAGE_LINKS = [{ href: "/blog", key: "blog" }] as const;

export function SiteHeader() {
  const t = useTranslations("nav");
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
        <Link href="/" className="shrink-0" aria-label="ApplyLadder">
          <Logo />
        </Link>

        <ul className="hidden items-center gap-0.5 md:flex">
          {SECTIONS.map((s) => (
            <li key={s.id}>
              <Link
                href={`/#${s.id}`}
                className="whitespace-nowrap rounded-full px-3 py-2 text-sm text-foreground/70 transition-colors hover:text-foreground"
              >
                {t(s.key)}
              </Link>
            </li>
          ))}
          {PAGE_LINKS.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                className="whitespace-nowrap rounded-full px-3 py-2 text-sm text-foreground/70 transition-colors hover:text-foreground"
              >
                {t(l.key)}
              </Link>
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
            className="hidden whitespace-nowrap rounded-full px-3 py-2 text-sm text-foreground/70 transition-colors hover:text-foreground lg:inline-block"
          >
            {t("signIn")}
          </a>
          <Link
            href="/consultation"
            className="hidden h-9 items-center gap-1.5 whitespace-nowrap rounded-full bg-[oklch(0.82_0.15_78)] px-4 text-sm font-medium text-[oklch(0.25_0.04_60)] shadow-md shadow-[oklch(0.82_0.15_78)]/30 transition-all hover:-translate-y-0.5 hover:bg-[oklch(0.86_0.15_78)] lg:inline-flex"
          >
            <MessageCircle className="size-4" />
            {t("consultation")}
          </Link>
          <ButtonLink
            href={CHROME_EXTENSION_URL}
            variant="secondary"
            size="sm"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden xl:inline-flex"
          >
            <Puzzle className="size-4" />
            {t("addToChrome")}
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
                <Link
                  href={`/#${s.id}`}
                  onClick={() => setOpen(false)}
                  className="block rounded-lg px-3 py-2.5 text-foreground/80 hover:bg-muted"
                >
                  {t(s.key)}
                </Link>
              </li>
            ))}
            {PAGE_LINKS.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-lg px-3 py-2.5 text-foreground/80 hover:bg-muted"
                >
                  {t(l.key)}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href="/consultation"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 rounded-lg bg-[oklch(0.82_0.15_78)] px-3 py-2.5 font-medium text-[oklch(0.25_0.04_60)] hover:bg-[oklch(0.86_0.15_78)]"
              >
                <MessageCircle className="size-4" />
                {t("consultation")}
              </Link>
            </li>
            <li>
              <a
                href={CHROME_EXTENSION_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-lg px-3 py-2.5 font-medium text-brand hover:bg-muted"
              >
                <Puzzle className="size-4" />
                {t("addToChrome")}
              </a>
            </li>
            <li className="mt-2">
              <LanguageSwitcher />
            </li>
          </ul>
        </div>
      )}
    </header>
  );
}
