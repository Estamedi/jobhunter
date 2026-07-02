import { useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/ui/reveal";
import { ButtonLink } from "@/components/ui/button";

export function FinalCta() {
  const t = useTranslations("finalCta");

  return (
    <section className="relative px-4 py-24 sm:px-6 sm:py-32">
      <Reveal>
        <div className="relative mx-auto max-w-5xl overflow-hidden rounded-[2rem] border border-brand/20 bg-gradient-to-br from-brand via-brand-accent to-brand-secondary px-6 py-16 text-center shadow-2xl shadow-brand/20 sm:px-16 sm:py-20">
          {/* Decorative glow */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-30 [background:radial-gradient(60%_60%_at_50%_0%,white,transparent)]"
          />
          <div className="relative">
            <h2 className="text-balance text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
              {t("title")}
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-pretty text-lg text-white/90">
              {t("subtitle")}
            </p>
            <div className="mt-9 flex justify-center">
              <ButtonLink
                href="#top"
                size="lg"
                className="bg-white text-brand shadow-lg hover:bg-white hover:text-brand"
              >
                {t("cta")}
                <ArrowRight className="size-4 rtl:rotate-180" />
              </ButtonLink>
            </div>
            <p className="mt-6 text-sm text-white/80">{t("reassure")}</p>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
