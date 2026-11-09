import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ConsultationForm } from "@/components/consultation-form";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "consultation" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: { canonical: `/${locale}/consultation` },
  };
}

export default async function ConsultationPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "consultation" });

  return (
    <>
      <SiteHeader />
      <main>
        <div className="mx-auto max-w-xl px-4 pb-24 pt-32 sm:px-6 sm:pt-40">
          <h1 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
            {t("title")}
          </h1>
          <p className="mb-8 mt-4 text-lg text-muted-foreground">
            {t("subtitle")}
          </p>
          <ConsultationForm />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
