import { getTranslations } from "next-intl/server";
import { loadMessages, SITE_URL } from "@/lib/content";
import { APP_URL } from "@/lib/links";

const faqKeys = ["free", "notion", "resumes", "linkedin", "privacy", "devices"];

export async function StructuredData({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "meta" });
  const faq = await getTranslations({ locale, namespace: "faq" });
  const messages = await loadMessages(locale);

  const json = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${SITE_URL}/#organization`,
        name: "ApplyLadder",
        url: SITE_URL,
        logo: `${SITE_URL}/apple-icon`,
        slogan: "Organize Your Career. Land Your Next Job.",
        contactPoint: {
          "@type": "ContactPoint",
          contactType: "customer support",
          email: "support@applyladder.com",
        },
      },
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        url: SITE_URL,
        name: "ApplyLadder",
        inLanguage: ["en", "fa", "ar"],
        publisher: { "@id": `${SITE_URL}/#organization` },
      },
      {
        "@type": "WebPage",
        "@id": `${SITE_URL}/${locale}#webpage`,
        url: `${SITE_URL}/${locale}`,
        name: t("title"),
        description: t("description"),
        inLanguage: locale,
        isPartOf: { "@id": `${SITE_URL}/#website` },
        about: { "@id": `${SITE_URL}/#app` },
      },
      {
        "@type": "SoftwareApplication",
        "@id": `${SITE_URL}/#app`,
        name: "ApplyLadder",
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        description: t("description"),
        url: `${SITE_URL}/${locale}`,
        installUrl: APP_URL,
        inLanguage: ["en", "fa", "ar"],
        publisher: { "@id": `${SITE_URL}/#organization` },
        featureList: Object.values(messages.features.items).map((f) => f.title),
        offers: [
          {
            "@type": "Offer",
            name: "Free",
            price: "0",
            priceCurrency: "USD",
          },
          {
            "@type": "Offer",
            name: "Pro",
            price: "9",
            priceCurrency: "USD",
          },
        ],
      },
      {
        "@type": "FAQPage",
        mainEntity: faqKeys.map((k) => ({
          "@type": "Question",
          name: faq(`items.${k}.q`),
          acceptedAnswer: {
            "@type": "Answer",
            text: faq(`items.${k}.a`),
          },
        })),
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }}
    />
  );
}
