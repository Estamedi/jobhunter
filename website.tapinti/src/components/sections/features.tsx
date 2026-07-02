import { useTranslations } from "next-intl";
import {
  Building2,
  Users,
  KanbanSquare,
  FileStack,
  CalendarClock,
  BellRing,
  Paperclip,
  LineChart,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { SectionHeading } from "@/components/ui/section-heading";
import { Reveal } from "@/components/ui/reveal";

const features: { key: string; icon: LucideIcon }[] = [
  { key: "companies", icon: Building2 },
  { key: "recruiters", icon: Users },
  { key: "pipeline", icon: KanbanSquare },
  { key: "resumes", icon: FileStack },
  { key: "interviews", icon: CalendarClock },
  { key: "followups", icon: BellRing },
  { key: "attachments", icon: Paperclip },
  { key: "analytics", icon: LineChart },
  { key: "ai", icon: Sparkles },
];

export function Features() {
  const t = useTranslations("features");

  return (
    <section
      id="features"
      className="relative border-y border-border bg-background-subtle py-24 sm:py-32"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          eyebrow={t("eyebrow")}
          title={t("title")}
          subtitle={t("subtitle")}
        />

        <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <Reveal key={f.key} delayIndex={i % 3}>
                <article className="group relative h-full overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-brand/40 hover:shadow-xl hover:shadow-brand/5">
                  <div
                    aria-hidden
                    className="absolute -end-8 -top-8 size-24 rounded-full bg-brand/5 opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-100"
                  />
                  <div className="inline-grid size-12 place-items-center rounded-xl bg-gradient-to-br from-brand/15 to-brand-accent/10 text-brand ring-1 ring-brand/10">
                    <Icon className="size-6" />
                  </div>
                  <h3 className="mt-5 text-lg font-semibold">
                    {t(`items.${f.key}.title`)}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {t(`items.${f.key}.desc`)}
                  </p>
                </article>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
