import { useTranslations } from "next-intl";
import {
  Table2,
  StickyNote,
  FileText,
  Mail,
  Calendar,
  FileType2,
  Unplug,
} from "lucide-react";
import { SectionHeading } from "@/components/ui/section-heading";
import { Reveal } from "@/components/ui/reveal";
import { LinkedinIcon } from "@/components/brand-icons";

const tools = [
  { key: "excel", icon: Table2 },
  { key: "notes", icon: StickyNote },
  { key: "notion", icon: FileText },
  { key: "gmail", icon: Mail },
  { key: "linkedin", icon: LinkedinIcon },
  { key: "calendar", icon: Calendar },
  { key: "pdfs", icon: FileType2 },
] as const;

export function Disconnected() {
  const t = useTranslations("disconnected");

  return (
    <section className="relative border-y border-border bg-background-subtle py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          eyebrow={t("eyebrow")}
          title={t("title")}
          subtitle={t("subtitle")}
        />

        <div className="mt-16 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
          {tools.map((tool, i) => {
            const Icon = tool.icon;
            return (
              <Reveal key={tool.key} delayIndex={i} as="div">
                <div className="group relative flex items-center gap-2.5 rounded-2xl border border-border bg-card px-4 py-3 shadow-sm">
                  <Icon className="size-5 text-muted-foreground grayscale transition group-hover:text-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">
                    {t(`tools.${tool.key}`)}
                  </span>
                  <span
                    aria-hidden
                    className="absolute -end-1.5 -top-1.5 grid size-5 place-items-center rounded-full bg-red-500/90 text-[11px] font-bold text-white shadow"
                  >
                    ✕
                  </span>
                </div>
              </Reveal>
            );
          })}
        </div>

        <Reveal delayIndex={2}>
          <div className="mx-auto mt-16 max-w-3xl text-center">
            <Unplug className="mx-auto size-8 text-brand" />
            <p className="mt-5 text-balance text-3xl font-bold tracking-tight sm:text-4xl">
              {t("punchline")}
            </p>
            <p className="mt-3 text-xl font-semibold text-gradient">
              {t("punchlineSub")}
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
