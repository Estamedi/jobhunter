import { useTranslations } from "next-intl";
import { ArrowRight, Puzzle, MousePointerClick, Sparkles, ShieldCheck } from "lucide-react";
import { Reveal } from "@/components/ui/reveal";
import { ButtonLink } from "@/components/ui/button";
import { SectionHeading } from "@/components/ui/section-heading";
import { CHROME_EXTENSION_URL } from "@/lib/links";

const points = [
  { key: "p1", icon: MousePointerClick },
  { key: "p2", icon: Sparkles },
  { key: "p3", icon: ShieldCheck },
] as const;

export function Extension() {
  const t = useTranslations("extension");

  return (
    <section id="extension" className="relative px-4 py-24 sm:px-6 sm:py-32">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow={t("eyebrow")}
          title={t("title")}
          subtitle={t("subtitle")}
        />
        <div className="mt-14 grid gap-4 sm:grid-cols-3">
          {points.map((p, i) => {
            const Icon = p.icon;
            return (
              <Reveal key={p.key} delayIndex={i}>
                <article className="h-full rounded-2xl border border-border bg-card p-6 shadow-sm">
                  <div className="inline-grid size-12 place-items-center rounded-xl bg-gradient-to-br from-brand/15 to-brand-accent/10 text-brand ring-1 ring-brand/10">
                    <Icon className="size-6" />
                  </div>
                  <h3 className="mt-5 text-lg font-semibold">{t(`${p.key}.title`)}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {t(`${p.key}.desc`)}
                  </p>
                </article>
              </Reveal>
            );
          })}
        </div>
        <div className="mt-10 flex flex-col items-center gap-3 text-center">
          <ButtonLink href={CHROME_EXTENSION_URL} size="lg" target="_blank" rel="noopener noreferrer">
            <Puzzle className="size-4" />
            {t("cta")}
            <ArrowRight className="size-4 rtl:rotate-180" />
          </ButtonLink>
          <p className="text-sm text-muted-foreground">{t("note")}</p>
        </div>
      </div>
    </section>
  );
}
