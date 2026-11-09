import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Link } from "@/i18n/navigation";
import { getBlogImage } from "@/lib/blog-image";
import { CONTENT_LOCALE, contentPages } from "@/content/pages";
import { listCmsArticles } from "@/lib/cms";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Blog: Job Search Guides and Tools",
  description:
    "Guides on tracking job applications, organising your job search and getting the most out of ApplyLadder, including the Chrome extension.",
  alternates: { canonical: `/${CONTENT_LOCALE}/blog` },
};

export default async function BlogIndex({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const cmsArticles = await listCmsArticles(locale);
  // The built-in pages are English only, so they are not linked from the other languages.
  const builtIn = locale === CONTENT_LOCALE ? contentPages : [];

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
            {cmsArticles.map((a) => (
              <li key={`cms-${a.slug}`}>
                <Link
                  href={`/${a.slug}`}
                  className="block overflow-hidden rounded-2xl border border-border bg-card transition-all hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-lg"
                >
                  {a.cover && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={a.cover}
                      alt=""
                      width={1200}
                      height={630}
                      className="aspect-[1200/630] w-full object-cover"
                    />
                  )}
                  <div className="p-6">
                    <h2 className="text-xl font-semibold">{a.title}</h2>
                    {a.excerpt && (
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                        {a.excerpt}
                      </p>
                    )}
                  </div>
                </Link>
              </li>
            ))}
            {builtIn.map((p) => {
              const image = getBlogImage(p.slug);
              return (
              <li key={p.slug}>
                <Link
                  href={`/${p.slug}`}
                  className="block overflow-hidden rounded-2xl border border-border bg-card transition-all hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-lg"
                >
                  {image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={image}
                      alt=""
                      width={1200}
                      height={630}
                      className="aspect-[1200/630] w-full object-cover"
                    />
                  )}
                  <div className="p-6">
                  <h2 className="text-xl font-semibold">{p.h1}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {p.description}
                  </p>
                  </div>
                </Link>
              </li>
              );
            })}
          </ul>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
