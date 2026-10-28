import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ContentPageView } from "@/components/content-page";
import { ContentStructuredData } from "@/components/content-structured-data";
import {
  CONTENT_LOCALE,
  contentPages,
  getContentPage,
} from "@/content/pages";
import { SITE_URL } from "@/lib/content";

// Content pages exist in English only; any other locale/slug is a 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return contentPages.map((p) => ({ locale: CONTENT_LOCALE, slug: p.slug }));
}

type Props = { params: Promise<{ locale: string; slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = getContentPage(slug);
  if (!page) return {};

  const url = `${SITE_URL}/${CONTENT_LOCALE}/${page.slug}`;
  const image = {
    url: `${SITE_URL}/${CONTENT_LOCALE}/opengraph-image`,
    width: 1200,
    height: 630,
    alt: "ApplyLadder — the Personal Career CRM",
  };
  return {
    title: page.title,
    description: page.description,
    alternates: {
      canonical: `/${CONTENT_LOCALE}/${page.slug}`,
      languages: {
        en: `/${CONTENT_LOCALE}/${page.slug}`,
        "x-default": `/${CONTENT_LOCALE}/${page.slug}`,
      },
      types: { "text/markdown": `/${CONTENT_LOCALE}/${page.slug}.md` },
    },
    openGraph: {
      type: "article",
      url,
      siteName: "ApplyLadder",
      title: page.title,
      description: page.description,
      locale: "en_US",
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title: page.title,
      description: page.description,
      images: [image],
    },
  };
}

export default async function ContentPageRoute({ params }: Props) {
  const { locale, slug } = await params;
  const page = getContentPage(slug);
  if (!page || locale !== CONTENT_LOCALE) notFound();
  setRequestLocale(locale);

  return (
    <>
      <ContentStructuredData page={page} />
      <SiteHeader />
      <main>
        <ContentPageView page={page} />
      </main>
      <SiteFooter />
    </>
  );
}
