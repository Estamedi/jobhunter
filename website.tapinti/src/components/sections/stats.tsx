"use client";

import { useEffect, useRef, useState } from "react";
import { useInView, animate } from "motion/react";
import { useLocale, useTranslations } from "next-intl";
import { SectionHeading } from "@/components/ui/section-heading";

const stats = [
  { key: "applications", value: 10000, suffix: "+" },
  { key: "companies", value: 500, suffix: "+" },
  { key: "countries", value: 40, suffix: "+" },
  { key: "organized", value: 98, suffix: "%" },
] as const;

function CountUp({ value, suffix }: { value: number; suffix: string }) {
  const locale = useLocale();
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const controls = animate(0, value, {
      duration: 1.6,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    return () => controls.stop();
  }, [inView, value]);

  const formatted = new Intl.NumberFormat(locale).format(display);

  return (
    <span ref={ref}>
      {formatted}
      {suffix}
    </span>
  );
}

export function Stats() {
  const t = useTranslations("stats");

  return (
    <section className="relative overflow-hidden py-20">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-transparent via-brand/[0.04] to-transparent"
      />
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading eyebrow={t("eyebrow")} title={t("title")} />

        <dl className="mt-14 grid grid-cols-2 gap-6 lg:grid-cols-4">
          {stats.map((s) => (
            <div
              key={s.key}
              className="rounded-2xl border border-border bg-card/60 p-6 text-center"
            >
              <dt className="sr-only">{t(`items.${s.key}`)}</dt>
              <dd>
                <span className="block text-4xl font-bold tracking-tight text-gradient sm:text-5xl">
                  <CountUp value={s.value} suffix={s.suffix} />
                </span>
                <span className="mt-2 block text-sm text-muted-foreground">
                  {t(`items.${s.key}`)}
                </span>
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
