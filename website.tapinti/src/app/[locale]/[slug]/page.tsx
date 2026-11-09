import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ContentPageView } from "@/components/content-page";
import { ContentStructuredData } from "@/components/content-structured-data";
import { CmsArticleView } from "@/components/cms-article";
import { CONTENT_LOCALE, contentPages } from "@/content/pages";
import { SITE_URL } from "@/lib/content";
import { getBlogImage } from "@/lib/blog-image";
import { cmsArticleLocales, getCmsArticle } from "@/lib/cms";
import { getPage, getRelatedPages } from "@/lib/pages";

// English pages come from the CMS, with the copies in content/pages.ts as a fallback. Other languages
// come from the CMS only. Nothing is built ahead except the English pages that already exist; any other
// slug is looked up when first visited, then cached and refreshed every minute.
export const dynamicParams = true;
export const revalidate = 60;

export function generateStaticParams() {
  return contentPages.map((p) => ({ locale: CONTENT_LOCALE, slug: p.slug }));
}

type Props = { params: Promise<{ locale: string; slug: string }> };

const absolute = (path: string) => (path.startsWith("http") ? path : `${SITE_URL}${path}`);

/** hreflang for one slug: every language that has it, plus x-default. */
async function languageAlternates(slug: string, current: string) {
  const locales = await cmsArticleLocales(slug);
  if (!locales.includes(current as (typeof locales)[number])) locales.push(current as (typeof locales)[number]);
  const languages: Record<string, string> = Object.fromEntries(
    locales.map((l) => [l, `/${l}/${slug}`]),
  );
  languages["x-default"] = `/${locales.includes("en") ? "en" : locales[0]}/${slug}`;
  return languages;
}

async function englishMetadata(slug: string): Promise<Metadata> {
  const page = await getPage(slug);
  if (!page) return {};

  const url = `${SITE_URL}/${CONTENT_LOCALE}/${page.slug}`;
  const cover = page.image ?? getBlogImage(page.slug);
  const image = {
    url: cover ? absolute(cover) : `${SITE_URL}/${CONTENT_LOCALE}/opengraph-image`,
    width: 1200,
    height: 630,
    alt: cover ? page.h1 : "ApplyLadder — the Personal Career CRM",
  };
  return {
    title: page.title,
    description: page.description,
    alternates: {
      canonical: `/${CONTENT_LOCALE}/${page.slug}`,
      languages: await languageAlternates(page.slug, CONTENT_LOCALE),
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

async function otherLocaleMetadata(locale: string, slug: string): Promise<Metadata> {
  const article = await getCmsArticle(locale, slug);
  if (!article) return {};

  const url = `${SITE_URL}/${locale}/${slug}`;
  const image = article.cover
    ? [absolute(article.cover)]
    : [`${SITE_URL}/${locale}/opengraph-image`];

  return {
    title: article.title,
    description: article.excerpt || undefined,
    alternates: {
      canonical: `/${locale}/${slug}`,
      languages: await languageAlternates(slug, locale),
    },
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
  return locale === CONTENT_LOCALE
    ? englishMetadata(slug)
    : otherLocaleMetadata(locale, slug);
}

export default async function ContentPageRoute({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  if (locale === CONTENT_LOCALE) {
    const page = await getPage(slug);
    if (!page) notFound();
    const related = await getRelatedPages(page);
    return (
      <>
        <ContentStructuredData page={page} />
        <SiteHeader />
        <main>
          <ContentPageView page={page} related={related} />
        </main>
        <SiteFooter />
      </>
    );
  }

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
