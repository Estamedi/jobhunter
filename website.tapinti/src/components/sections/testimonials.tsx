import { useTranslations } from "next-intl";
import { Star } from "lucide-react";
import { SectionHeading } from "@/components/ui/section-heading";
import { Reveal } from "@/components/ui/reveal";

const items = ["t1", "t2", "t3", "t4"] as const;

const avatarGradients = [
  "from-brand to-brand-accent",
  "from-brand-secondary to-brand",
  "from-brand-accent to-brand-secondary",
  "from-brand to-brand-secondary",
];

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("");
}

export function Testimonials() {
  const t = useTranslations("testimonials");

  return (
    <section id="stories" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading eyebrow={t("eyebrow")} title={t("title")} />

        <div className="mt-16 grid gap-4 sm:grid-cols-2">
          {items.map((k, i) => {
            const name = t(`items.${k}.name`);
            return (
              <Reveal key={k} delayIndex={i % 2}>
                <figure className="flex h-full flex-col rounded-2xl border border-border bg-card p-7 shadow-sm">
                  <div className="flex gap-0.5 text-amber-400">
                    {Array.from({ length: 5 }).map((_, s) => (
                      <Star key={s} className="size-4 fill-current" />
                    ))}
                  </div>
                  <blockquote className="mt-4 flex-1 text-pretty text-lg leading-relaxed text-foreground/90">
                    &ldquo;{t(`items.${k}.quote`)}&rdquo;
                  </blockquote>
                  <figcaption className="mt-6 flex items-center gap-3">
                    <span
                      className={`grid size-11 place-items-center rounded-full bg-gradient-to-br ${avatarGradients[i]} text-sm font-semibold text-white`}
                      aria-hidden
                    >
                      {initials(name)}
                    </span>
                    <span>
                      <span className="block font-semibold">{name}</span>
                      <span className="block text-sm text-muted-foreground">
                        {t(`items.${k}.role`)}
                      </span>
                    </span>
                  </figcaption>
                </figure>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
