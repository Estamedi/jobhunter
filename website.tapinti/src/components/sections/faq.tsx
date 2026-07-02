import { useTranslations } from "next-intl";
import { Plus } from "lucide-react";
import { SectionHeading } from "@/components/ui/section-heading";
import { Reveal } from "@/components/ui/reveal";

const items = [
  "free",
  "notion",
  "resumes",
  "linkedin",
  "privacy",
  "devices",
] as const;

export function Faq() {
  const t = useTranslations("faq");

  return (
    <section id="faq" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <SectionHeading eyebrow={t("eyebrow")} title={t("title")} />

        <div className="mt-14 space-y-3">
          {items.map((k, i) => (
            <Reveal key={k} delayIndex={i % 3}>
              <details className="group rounded-2xl border border-border bg-card/60 px-6 [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 text-start text-base font-semibold">
                  {t(`items.${k}.q`)}
                  <Plus className="size-5 shrink-0 text-brand transition-transform duration-300 group-open:rotate-45" />
                </summary>
                <p className="pb-5 text-pretty leading-relaxed text-muted-foreground">
                  {t(`items.${k}.a`)}
                </p>
              </details>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
