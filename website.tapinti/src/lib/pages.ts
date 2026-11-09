import {
  CONTENT_LOCALE,
  contentPages,
  getContentPage,
  type ContentPage,
  type ContentSection,
} from "@/content/pages";
import { getCmsArticle, listCmsArticles, type CmsArticle } from "@/lib/cms";

/**
 * English content pages. The CMS is the source; the copies in content/pages.ts are used when the CMS has no
 * published entry for a slug (or CMS_URL is not set, as during `next build`). If the CMS cannot be reached
 * these functions throw, so Next keeps serving the last good copy of every page instead of caching a
 * different version.
 */

/**
 * The article body is markdown in the CMS: "## Heading" starts a section, a line starting with "- " is a
 * bullet, and blank lines separate paragraphs. Text before the first heading becomes a section without
 * a heading.
 */
export function parseSections(markdown: string): ContentSection[] {
  const sections: ContentSection[] = [];
  let current: ContentSection | null = null;
  let paragraph: string[] = [];

  const ensure = (): ContentSection => {
    if (!current) {
      current = { heading: "", body: [] };
      sections.push(current);
    }
    return current;
  };
  const flush = () => {
    if (paragraph.length > 0) {
      ensure().body.push(paragraph.join(" "));
      paragraph = [];
    }
  };

  for (const raw of markdown.replace(/\r\n/g, "\n").split("\n")) {
    const line = raw.trim();
    const heading = /^##\s+(.+)$/.exec(line);
    const bullet = /^[-*]\s+(.+)$/.exec(line);
    if (heading) {
      flush();
      current = { heading: heading[1].trim(), body: [] };
      sections.push(current);
    } else if (bullet) {
      flush();
      const section = ensure();
      (section.bullets ??= []).push(bullet[1].trim());
    } else if (line === "") {
      flush();
    } else {
      paragraph.push(line);
    }
  }
  flush();
  return sections;
}

export function articleToPage(a: CmsArticle): ContentPage {
  return {
    slug: a.slug,
    title: a.seoTitle ?? a.title,
    description: a.seoDescription ?? a.excerpt,
    h1: a.title,
    intro: a.excerpt,
    sections: parseSections(a.content),
    faq: a.faq,
    related: a.related,
    updated: a.updatedDate ?? a.publishedDate ?? a.updatedAt?.slice(0, 10) ?? "",
    download: a.download,
    externalCta: a.externalCta,
    label: a.label ?? a.title,
    image: a.cover,
  };
}

/** One English page by slug: from the CMS when published there, else the built-in copy. */
export async function getPage(slug: string): Promise<ContentPage | undefined> {
  const article = await getCmsArticle(CONTENT_LOCALE, slug);
  return article ? articleToPage(article) : getContentPage(slug);
}

/** The related pages of a page that can be resolved, in the order the page lists them. */
export async function getRelatedPages(page: ContentPage): Promise<ContentPage[]> {
  const pages = await Promise.all(page.related.map((slug) => getPage(slug)));
  return pages.filter((p): p is ContentPage => Boolean(p));
}

/** Every English page: new CMS articles first (newest first), then the built-in order, CMS copies winning. */
export async function listPages(): Promise<ContentPage[]> {
  const cms = await listCmsArticles(CONTENT_LOCALE);
  const bySlug = new Map(cms.map((a) => [a.slug, a]));
  const builtInSlugs = new Set(contentPages.map((p) => p.slug));
  const added = cms.filter((a) => !builtInSlugs.has(a.slug)).map(articleToPage);
  const builtIn = contentPages.map((p) => {
    const a = bySlug.get(p.slug);
    return a ? articleToPage(a) : p;
  });
  return [...added, ...builtIn];
}
