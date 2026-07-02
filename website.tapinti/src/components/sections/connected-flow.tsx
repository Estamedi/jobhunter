"use client";

import { useRef } from "react";
import { motion, useScroll, useSpring } from "motion/react";
import { useTranslations } from "next-intl";
import {
  Building2,
  Users,
  Briefcase,
  FileText,
  CalendarClock,
  Award,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { SectionHeading } from "@/components/ui/section-heading";

const steps: { key: string; icon: LucideIcon }[] = [
  { key: "company", icon: Building2 },
  { key: "recruiters", icon: Users },
  { key: "jobs", icon: Briefcase },
  { key: "resume", icon: FileText },
  { key: "interview", icon: CalendarClock },
  { key: "offer", icon: Award },
  { key: "career", icon: TrendingUp },
];

export function ConnectedFlow() {
  const t = useTranslations("connected");
  const railRef = useRef<HTMLDivElement>(null);

  // Draw the connecting line as the section scrolls through the viewport
  const { scrollYProgress } = useScroll({
    target: railRef,
    offset: ["start 0.75", "end 0.6"],
  });
  const scaleY = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 30,
    restDelta: 0.001,
  });

  return (
    <section id="how" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          eyebrow={t("eyebrow")}
          title={t("title")}
          subtitle={t("subtitle")}
        />

        <div ref={railRef} className="relative mx-auto mt-16 max-w-2xl">
          {/* Rail track */}
          <div
            aria-hidden
            className="absolute inset-y-2 start-6 w-px -translate-x-1/2 bg-border rtl:translate-x-1/2"
          />
          {/* Animated fill */}
          <motion.div
            aria-hidden
            style={{ scaleY }}
            className="absolute inset-y-2 start-6 w-[3px] -translate-x-1/2 origin-top rounded bg-gradient-to-b from-brand via-brand-accent to-brand-secondary rtl:translate-x-1/2"
          />

          <ul className="space-y-3">
            {steps.map((step, i) => {
              const Icon = step.icon;
              return (
                <motion.li
                  key={step.key}
                  initial={{ opacity: 0, x: 24 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{
                    duration: 0.5,
                    delay: i * 0.05,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className="relative flex items-start gap-4 ps-16"
                >
                  {/* Node dot */}
                  <span className="absolute start-6 top-2 grid size-12 -translate-x-1/2 place-items-center rounded-xl border border-border bg-card shadow-md rtl:translate-x-1/2">
                    <Icon className="size-5 text-brand" />
                  </span>
                  <div className="rounded-2xl border border-border bg-card/60 px-5 py-4 shadow-sm">
                    <div className="text-base font-semibold">
                      {t(`nodes.${step.key}`)}
                    </div>
                    <div className="mt-1 text-sm text-muted-foreground">
                      {t(`captions.${step.key}`)}
                    </div>
                  </div>
                </motion.li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}
