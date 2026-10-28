import { Link } from "@/i18n/navigation";
import { Plus } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { SIGN_UP_URL } from "@/lib/links";
import { getContentPage, type ContentPage } from "@/content/pages";

export function ContentPageView({ page }: { page: ContentPage }) {
  const related = page.related
    .map((slug) => getContentPage(slug))
    .filter((p): p is ContentPage => Boolean(p));

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
          <li aria-current="page" className="text-foreground">
            {page.label}
          </li>
        </ol>
      </nav>

      <h1 className="mt-6 text-balance text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl">
        {page.h1}
      </h1>
      <p className="mt-6 text-pretty text-lg leading-relaxed text-muted-foreground">
        {page.intro}
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <ButtonLink href={SIGN_UP_URL} size="lg">
          Start Free
        </ButtonLink>
        <ButtonLink href="/#pricing" variant="secondary" size="lg">
          See pricing
        </ButtonLink>
      </div>

      {page.sections.map((section) => (
        <section key={section.heading} className="mt-14">
          <h2 className="text-balance text-2xl font-bold tracking-tight sm:text-3xl">
            {section.heading}
          </h2>
          {section.body.map((paragraph) => (
            <p
              key={paragraph}
              className="mt-4 text-pretty leading-relaxed text-foreground/85"
            >
              {paragraph}
            </p>
          ))}
          {section.bullets && (
            <ul className="mt-4 list-disc space-y-2 ps-6 leading-relaxed text-foreground/85">
              {section.bullets.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
          )}
        </section>
      ))}

      <section className="mt-16">
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Frequently asked questions
        </h2>
        <div className="mt-6 space-y-3">
          {page.faq.map((item) => (
            <details
              key={item.q}
              className="group rounded-2xl border border-border bg-card/60 px-6 [&_summary::-webkit-details-marker]:hidden"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 text-start text-base font-semibold">
                <h3 className="text-base font-semibold">{item.q}</h3>
                <Plus className="size-5 shrink-0 text-brand transition-transform duration-300 group-open:rotate-45" />
              </summary>
              <p className="pb-5 text-pretty leading-relaxed text-muted-foreground">
                {item.a}
              </p>
            </details>
          ))}
        </div>
      </section>

      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="text-xl font-bold tracking-tight">Related</h2>
          <ul className="mt-4 space-y-2">
            {related.map((r) => (
              <li key={r.slug}>
                <Link
                  href={`/${r.slug}`}
                  className="text-brand underline-offset-4 hover:underline"
                >
                  {r.label}
                </Link>
                <span className="text-muted-foreground"> · {r.description}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

    </article>
  );
}
