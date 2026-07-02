import { setRequestLocale } from "next-intl/server";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { StructuredData } from "@/components/structured-data";
import { Hero } from "@/components/sections/hero";
import { Problem } from "@/components/sections/problem";
import { Disconnected } from "@/components/sections/disconnected";
import { ConnectedFlow } from "@/components/sections/connected-flow";
import { Features } from "@/components/sections/features";
import { Mindset } from "@/components/sections/mindset";
import { Stats } from "@/components/sections/stats";
import { Testimonials } from "@/components/sections/testimonials";
import { Pricing } from "@/components/sections/pricing";
import { Faq } from "@/components/sections/faq";
import { FinalCta } from "@/components/sections/final-cta";

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <StructuredData locale={locale} />
      <SiteHeader />
      <main>
        <Hero />
        <Problem />
        <Disconnected />
        <ConnectedFlow />
        <Features />
        <Mindset />
        <Stats />
        <Testimonials />
        <Pricing />
        <Faq />
        <FinalCta />
      </main>
      <SiteFooter />
    </>
  );
}
