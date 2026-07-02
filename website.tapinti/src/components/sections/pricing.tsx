import { useTranslations } from "next-intl";
import { Check } from "lucide-react";
import { SectionHeading } from "@/components/ui/section-heading";
import { Reveal } from "@/components/ui/reveal";
import { ButtonLink } from "@/components/ui/button";
import { SIGN_UP_URL } from "@/lib/links";
import { cn } from "@/lib/utils";

const plans = [
  { key: "free", featureKeys: ["f1", "f2", "f3", "f4"], highlight: false, soon: false },
  {
    key: "pro",
    featureKeys: ["f1", "f2", "f3", "f4", "f5"],
    highlight: true,
    soon: false,
  },
  {
    key: "team",
    featureKeys: ["f1", "f2", "f3", "f4"],
    highlight: false,
    soon: true,
  },
] as const;

export function Pricing() {
  const t = useTranslations("pricing");

  return (
    <section
      id="pricing"
      className="relative border-y border-border bg-background-subtle py-24 sm:py-32"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          eyebrow={t("eyebrow")}
          title={t("title")}
          subtitle={t("subtitle")}
        />

        <div className="mt-16 grid items-start gap-6 lg:grid-cols-3">
          {plans.map((plan, i) => (
            <Reveal key={plan.key} delayIndex={i}>
              <div
                className={cn(
                  "relative flex h-full flex-col rounded-3xl border p-8 shadow-sm",
                  plan.highlight
                    ? "border-brand/40 bg-card shadow-xl shadow-brand/10 lg:-mt-4 lg:mb-4"
                    : "border-border bg-card/60",
                )}
              >
                {plan.highlight && (
                  <span className="absolute -top-3 start-8 rounded-full bg-brand px-3 py-1 text-xs font-semibold text-white shadow-md">
                    {t("mostPopular")}
                  </span>
                )}
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">
                    {t(`plans.${plan.key}.name`)}
                  </h3>
                  {plan.soon && (
                    <span className="rounded-full border border-border px-2.5 py-0.5 text-xs text-muted-foreground">
                      {t("comingSoon")}
                    </span>
                  )}
                </div>

                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-bold tracking-tight">
                    {t(`plans.${plan.key}.price`)}
                  </span>
                  {plan.key !== "team" && (
                    <span className="text-sm text-muted-foreground">
                      {t("perMonth")}
                    </span>
                  )}
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {t(`plans.${plan.key}.tagline`)}
                </p>

                <ButtonLink
                  href={SIGN_UP_URL}
                  variant={plan.highlight ? "primary" : "secondary"}
                  className="mt-6 w-full"
                >
                  {t(`plans.${plan.key}.cta`)}
                </ButtonLink>

                <ul className="mt-8 space-y-3">
                  {plan.featureKeys.map((fk) => (
                    <li key={fk} className="flex items-start gap-3 text-sm">
                      <Check className="mt-0.5 size-4 shrink-0 text-brand" />
                      <span className="text-foreground/80">
                        {t(`plans.${plan.key}.features.${fk}`)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
