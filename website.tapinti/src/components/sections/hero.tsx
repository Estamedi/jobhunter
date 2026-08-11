"use client";

import { motion, type Variants } from "motion/react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { ArrowRight, Play, ShieldCheck, Sparkles } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { SIGN_UP_URL } from "@/lib/links";

const container: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } },
};

const item: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  },
};

export function Hero() {
  const t = useTranslations("hero");

  return (
    <section id="top" className="relative overflow-hidden pt-28 sm:pt-36">
      {/* Ambient gradient blobs */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      >
        <div className="absolute -top-40 start-1/4 size-[42rem] rounded-full bg-brand/20 opacity-60 blur-3xl animate-blob dark:bg-brand/25" />
        <div className="absolute -top-20 end-0 size-[34rem] rounded-full bg-brand-secondary/15 opacity-50 blur-3xl animate-blob [animation-delay:-6s]" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      </div>

      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* Copy */}
        <motion.div
          variants={container}
          initial="hidden"
          animate="visible"
          className="mx-auto max-w-2xl text-center"
        >
          <motion.span
            variants={item}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur"
          >
            <Sparkles className="size-3.5 text-brand" />
            {t("badge")}
          </motion.span>

          <motion.h1
            variants={item}
            className="mt-6 text-balance text-5xl font-bold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl"
          >
            {t("titleLead")}{" "}
            <span className="text-gradient">{t("titleHighlight")}</span>
          </motion.h1>

          <motion.p
            variants={item}
            className="mx-auto mt-6 max-w-xl text-pretty text-lg leading-relaxed text-muted-foreground"
          >
            {t("subtitle")}
          </motion.p>

          <motion.div
            variants={item}
            className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center"
          >
            <ButtonLink href={SIGN_UP_URL} size="lg" className="w-full sm:w-auto">
              {t("primaryCta")}
              <ArrowRight className="size-4 rtl:rotate-180" />
            </ButtonLink>
            <ButtonLink
              href="#how"
              variant="secondary"
              size="lg"
              className="w-full sm:w-auto"
            >
              <Play className="size-4" />
              {t("secondaryCta")}
            </ButtonLink>
          </motion.div>

          <motion.div
            variants={item}
            className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-muted-foreground"
          >
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="size-4 text-brand" />
              {t("noCard")}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="size-4 text-brand" />
              {t("freeForever")}
            </span>
          </motion.div>
        </motion.div>

        {/* Hero illustration */}
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="relative mt-12 sm:mt-16"
        >
          <div className="relative">
            <div className="absolute -inset-4 -z-10 rounded-[2rem] bg-gradient-to-tr from-brand/20 via-brand-accent/10 to-brand-secondary/20 blur-2xl" />
            <motion.div
              animate={{ x: [0, 16, -12, 0], y: [0, -10, 6, 0] }}
              transition={{
                duration: 22,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <Image
                src="/H02.webp"
                alt="Clouds carrying job titles like Software Engineer, Designer, Nurse and Pilot"
                width={1697}
                height={927}
                priority
                className="h-auto w-full"
              />
            </motion.div>

            <div
              className="absolute"
              style={{ left: "35.6%", width: "32%", bottom: "0%" }}
            >
              <Image
                src="/table01.webp"
                alt="A desk with a resume, a checklist, and a notebook and pen"
                width={1667}
                height={943}
                className="h-auto w-full"
              />
            </div>

            <motion.div
              className="absolute"
              style={{ left: "44.7%", width: "13.8%", bottom: "3%" }}
              animate={{
                y: [0, 0, -1, 0, 0],
                scaleX: [1, 1, 1, 1.03, 1],
                scaleY: [1, 1, 1, 0.97, 1],
              }}
              transition={{
                duration: 2.4,
                times: [0, 0.3, 0.45, 0.7, 1],
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <Image
                src="/jobseeker01.webp"
                alt="A job seeker jumping up to reach for a job title"
                width={442}
                height={1182}
                className="h-auto w-full"
                style={{ transformOrigin: "bottom center" }}
              />
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
