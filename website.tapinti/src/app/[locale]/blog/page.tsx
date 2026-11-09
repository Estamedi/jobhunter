import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Link } from "@/i18n/navigation";
import { getBlogImage } from "@/lib/blog-image";
import { CONTENT_LOCALE } from "@/content/pages";
import { listCmsArticles } from "@/lib/cms";
import { listPages } from "@/lib/pages";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Blog: Job Search Guides and Tools",
  description:
    "Guides on tracking job applications, organising your job search and getting the most out of ApplyLadder, including the Chrome extension.",
  alternates: { canonical: `/${CONTENT_LOCALE}/blog` },
};

type Card = { slug: string; title: string; description: string; image?: string };

async function loadCards(locale: string): Promise<Card[]> {
  if (locale === CONTENT_LOCALE) {
    return (await listPages()).map((p) => ({
      slug: p.slug,
      title: p.h1,
      description: p.description,
      image: p.image ?? getBlogImage(p.slug),
    }));
  }
  // Other languages list the articles written in the CMS in that language.
  return (await listCmsArticles(locale)).map((a) => ({
    slug: a.slug,
    title: a.title,
    description: a.excerpt,
    image: a.cover,
  }));
}

export default async function BlogIndex({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const cards = await loadCards(locale);

  return (
    <>
      <SiteHeader />
      <main>
        <div className="mx-auto max-w-3xl px-4 pb-24 pt-32 sm:px-6 sm:pt-40">
          <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl">
            Blog
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Guides and tools for running a calmer, better-organised job search.
          </p>
          <ul className="mt-12 space-y-4">
            {cards.map((c) => (
              <li key={c.slug}>
                <Link
                  href={`/${c.slug}`}
                  className="block overflow-hidden rounded-2xl border border-border bg-card transition-all hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-lg"
                >
                  {c.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={c.image}
                      alt=""
                      width={1200}
                      height={630}
                      className="aspect-[1200/630] w-full object-cover"
                    />
                  )}
                  <div className="p-6">
                    <h2 className="text-xl font-semibold">{c.title}</h2>
                    {c.description && (
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                        {c.description}
                      </p>
                    )}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
