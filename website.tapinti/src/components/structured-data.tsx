import { getTranslations } from "next-intl/server";

const SITE_URL = "https://tapinti.com";

export async function StructuredData({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "meta" });
  const faq = await getTranslations({ locale, namespace: "faq" });
  const faqKeys = ["free", "notion", "resumes", "linkedin", "privacy", "devices"];

  const json = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareApplication",
        name: "Tapinti",
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        description: t("description"),
        url: `${SITE_URL}/${locale}`,
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
        aggregateRating: {
          "@type": "AggregateRating",
          ratingValue: "4.9",
          ratingCount: "1280",
        },
      },
      {
        "@type": "Organization",
        name: "Tapinti",
        url: SITE_URL,
        slogan: "Organize Your Career. Land Your Next Job.",
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
