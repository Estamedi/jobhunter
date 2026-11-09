import type { ComponentProps } from "react";
import Markdown from "react-markdown";
import { Link } from "@/i18n/navigation";
import { ButtonLink } from "@/components/ui/button";
import { SIGN_UP_URL } from "@/lib/links";
import { SITE_URL } from "@/lib/content";
import type { CmsArticle } from "@/lib/cms";

const markdownComponents = {
  h2: ({ node: _n, ...p }: ComponentProps<"h2"> & { node?: unknown }) => (
    <h2 className="mt-12 text-balance text-2xl font-bold tracking-tight sm:text-3xl" {...p} />
  ),
  h3: ({ node: _n, ...p }: ComponentProps<"h3"> & { node?: unknown }) => (
    <h3 className="mt-8 text-xl font-semibold tracking-tight" {...p} />
  ),
  p: ({ node: _n, ...p }: ComponentProps<"p"> & { node?: unknown }) => (
    <p className="mt-4 text-pretty leading-relaxed text-foreground/85" {...p} />
  ),
  ul: ({ node: _n, ...p }: ComponentProps<"ul"> & { node?: unknown }) => (
    <ul className="mt-4 list-disc space-y-2 ps-6 text-foreground/85" {...p} />
  ),
  ol: ({ node: _n, ...p }: ComponentProps<"ol"> & { node?: unknown }) => (
    <ol className="mt-4 list-decimal space-y-2 ps-6 text-foreground/85" {...p} />
  ),
  a: ({ node: _n, ...p }: ComponentProps<"a"> & { node?: unknown }) => (
    <a className="text-brand underline underline-offset-2 hover:opacity-80" {...p} />
  ),
  blockquote: ({ node: _n, ...p }: ComponentProps<"blockquote"> & { node?: unknown }) => (
    <blockquote className="mt-4 border-s-4 border-brand/40 ps-4 italic text-muted-foreground" {...p} />
  ),
  img: ({ node: _n, alt, ...p }: ComponentProps<"img"> & { node?: unknown }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={alt ?? ""} className="mt-6 w-full rounded-xl border border-border" {...p} />
  ),
  code: ({ node: _n, ...p }: ComponentProps<"code"> & { node?: unknown }) => (
    <code className="rounded bg-muted px-1.5 py-0.5 text-sm" {...p} />
  ),
};

function youtubeId(url?: string): string | undefined {
  if (!url) return undefined;
  const m = url.match(/(?:youtu\.be\/|v=|embed\/)([\w-]{11})/);
  return m?.[1];
}

export function CmsArticleView({ article }: { article: CmsArticle }) {
  const video = article.kind === "video" ? youtubeId(article.youtubeUrl) : undefined;

  return (
    <article className="mx-auto max-w-3xl px-4 pb-24 pt-32 sm:px-6 sm:pt-40">
      <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
        <ol className="flex items-center gap-2">
          <li>
            <Link href="/" className="hover:text-foreground">
              Home
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li>
            <Link href="/blog" className="hover:text-foreground">
              Blog
            </Link>
          </li>
        </ol>
      </nav>

      <h1 className="mt-6 text-balance text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl">
        {article.title}
      </h1>
      {article.publishedDate && (
        <time dateTime={article.publishedDate} className="mt-4 block text-sm text-muted-foreground">
          {article.publishedDate}
        </time>
      )}
      {article.excerpt && (
        <p className="mt-6 text-pretty text-lg leading-relaxed text-muted-foreground">
          {article.excerpt}
        </p>
      )}

      {video ? (
        <div className="mt-8 aspect-video overflow-hidden rounded-2xl border border-border">
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${video}`}
            title={article.title}
            allow="accelerometer; encrypted-media; picture-in-picture"
            allowFullScreen
            loading="lazy"
            className="size-full"
          />
        </div>
      ) : (
        article.cover && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={article.cover}
            alt={article.title}
            className="mt-8 aspect-[1200/630] w-full rounded-2xl border border-border object-cover"
          />
        )
      )}

      <div className="mt-6">
        <Markdown components={markdownComponents}>{article.content}</Markdown>
      </div>

      <div className="mt-14 flex flex-wrap gap-3">
        <ButtonLink href={SIGN_UP_URL} size="lg">
          Start Free
        </ButtonLink>
      </div>

      <ArticleStructuredData article={article} />
    </article>
  );
}

function ArticleStructuredData({ article }: { article: CmsArticle }) {
  const url = `${SITE_URL}/${article.locale}/${article.slug}`;
  const json = {
    "@context": "https://schema.org",
    "@type": article.kind === "video" ? "VideoObject" : "Article",
    headline: article.title,
    name: article.title,
    description: article.excerpt || undefined,
    inLanguage: article.locale,
    datePublished: article.publishedDate,
    dateModified: article.updatedAt ?? article.publishedDate,
    mainEntityOfPage: url,
    image: article.cover
      ? [article.cover.startsWith("http") ? article.cover : `${SITE_URL}${article.cover}`]
      : undefined,
    publisher: { "@type": "Organization", name: "ApplyLadder", url: SITE_URL },
  };
  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: JSON.stringify(json).replace(/</g, "\\u003c") }}
    />
  );
}
