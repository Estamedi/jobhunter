import { useTranslations } from "next-intl";
import { SectionHeading } from "@/components/ui/section-heading";
import { Reveal } from "@/components/ui/reveal";
import { cn } from "@/lib/utils";

const quoteKeys = ["q1", "q2", "q3", "q4", "q5", "q6"] as const;

// Slight rotation per card for a scattered "sticky-note" feel
const rotations = [
  "sm:-rotate-2",
  "sm:rotate-1",
  "sm:rotate-2",
  "sm:-rotate-1",
  "sm:rotate-2",
  "sm:-rotate-2",
];

export function Problem() {
  const t = useTranslations("problem");

  return (
    <section className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          eyebrow={t("eyebrow")}
          title={t("title")}
          subtitle={t("subtitle")}
        />

        <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {quoteKeys.map((k, i) => (
            <Reveal key={k} delayIndex={i}>
              <figure
                className={cn(
                  "group h-full rounded-2xl border border-border bg-card/60 p-6 shadow-sm transition-transform duration-300 hover:-translate-y-1 hover:rotate-0",
                  rotations[i],
                )}
              >
                <span
                  aria-hidden
                  className="text-4xl font-serif leading-none text-brand/30"
                >
                  &ldquo;
                </span>
                <blockquote className="mt-1 text-lg font-medium leading-snug text-foreground/90">
                  {t(`quotes.${k}`)}
                </blockquote>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
