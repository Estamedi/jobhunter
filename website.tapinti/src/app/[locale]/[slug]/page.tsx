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
import { getBlogImage } from "@/lib/blog-image";
import { cmsArticleLocales, getCmsArticle } from "@/lib/cms";
import { CmsArticleView } from "@/components/cms-article";

// Built-in content pages exist in English only. Any other slug is looked up in the CMS (in the
// requested language) when it is first visited, then cached and refreshed every minute.
export const dynamicParams = true;
export const revalidate = 60;

export function generateStaticParams() {
  return contentPages.map((p) => ({ locale: CONTENT_LOCALE, slug: p.slug }));
}

type Props = { params: Promise<{ locale: string; slug: string }> };

async function cmsMetadata(locale: string, slug: string): Promise<Metadata> {
  const article = await getCmsArticle(locale, slug);
  if (!article) return {};

  const url = `${SITE_URL}/${locale}/${slug}`;
  const locales = await cmsArticleLocales(slug);
  const languages: Record<string, string> = Object.fromEntries(
    locales.map((l) => [l, `/${l}/${slug}`]),
  );
  languages["x-default"] = `/${locales.includes("en") ? "en" : locales[0] ?? locale}/${slug}`;
  const image = article.cover
    ? [article.cover.startsWith("http") ? article.cover : `${SITE_URL}${article.cover}`]
    : [`${SITE_URL}/${locale}/opengraph-image`];

  return {
    title: article.title,
    description: article.excerpt || undefined,
    alternates: { canonical: `/${locale}/${slug}`, languages },
    openGraph: {
      type: "article",
      url,
      siteName: "ApplyLadder",
      title: article.title,
      description: article.excerpt || undefined,
      publishedTime: article.publishedDate,
      images: image,
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description: article.excerpt || undefined,
      images: image,
    },
  };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const page = locale === CONTENT_LOCALE ? getContentPage(slug) : undefined;
  if (!page) return cmsMetadata(locale, slug);

  const url = `${SITE_URL}/${CONTENT_LOCALE}/${page.slug}`;
  const cover = getBlogImage(page.slug);
  const image = {
    url: cover
      ? `${SITE_URL}${cover}`
      : `${SITE_URL}/${CONTENT_LOCALE}/opengraph-image`,
    width: 1200,
    height: 630,
    alt: cover ? page.h1 : "ApplyLadder — the Personal Career CRM",
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
  setRequestLocale(locale);
  const page = locale === CONTENT_LOCALE ? getContentPage(slug) : undefined;

  if (!page) {
    const article = await getCmsArticle(locale, slug);
    if (!article) notFound();
    return (
      <>
        <SiteHeader />
        <main>
          <CmsArticleView article={article} />
        </main>
        <SiteFooter />
      </>
    );
  }

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
