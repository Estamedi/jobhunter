import { useTranslations } from "next-intl";
import { ArrowRight, RotateCcw } from "lucide-react";
import { SectionHeading } from "@/components/ui/section-heading";
import { Reveal } from "@/components/ui/reveal";

const oldSteps = ["apply", "forget", "repeat"] as const;
const newSteps = [
  "research",
  "prepare",
  "apply",
  "track",
  "learn",
  "improve",
  "getHired",
] as const;

export function Mindset() {
  const t = useTranslations("mindset");

  return (
    <section className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          eyebrow={t("eyebrow")}
          title={t("title")}
          subtitle={t("subtitle")}
        />

        <div className="mt-16 grid gap-6 lg:grid-cols-2">
          {/* Old way */}
          <Reveal>
            <div className="h-full rounded-3xl border border-border bg-card/40 p-8">
              <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                <RotateCcw className="size-4" />
                {t("oldWay")}
              </div>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                {oldSteps.map((s, i) => (
                  <div key={s} className="flex items-center gap-3">
                    <span className="rounded-xl border border-border bg-background px-4 py-2.5 text-base font-medium text-muted-foreground line-through decoration-red-400/60">
                      {t(`old.${s}`)}
                    </span>
                    {i < oldSteps.length - 1 && (
                      <ArrowRight className="size-4 text-muted-foreground/50 rtl:rotate-180" />
                    )}
                  </div>
                ))}
              </div>
              <p className="mt-8 text-sm text-muted-foreground">
                {/* subtle: an endless, forgetful loop */}
              </p>
            </div>
          </Reveal>

          {/* New way */}
          <Reveal delayIndex={1}>
            <div className="relative h-full overflow-hidden rounded-3xl border border-brand/30 bg-gradient-to-br from-brand/[0.07] to-brand-secondary/[0.05] p-8">
              <div
                aria-hidden
                className="absolute -end-10 -top-10 size-40 rounded-full bg-brand/10 blur-3xl"
              />
              <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-brand">
                <ArrowRight className="size-4 rtl:rotate-180" />
                {t("newWay")}
              </div>
              <div className="mt-8 flex flex-wrap items-center gap-2.5">
                {newSteps.map((s, i) => (
                  <div key={s} className="flex items-center gap-2.5">
                    <span className="rounded-xl border border-brand/20 bg-card px-4 py-2.5 text-base font-semibold shadow-sm">
                      {t(`new.${s}`)}
                    </span>
                    {i < newSteps.length - 1 && (
                      <ArrowRight className="size-4 text-brand/50 rtl:rotate-180" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
