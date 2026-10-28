import { CONTENT_LOCALE, contentPages } from "@/content/pages";
import { contentPageMarkdown } from "@/lib/content";

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return contentPages.map((p) => ({ locale: CONTENT_LOCALE, slug: p.slug }));
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ locale: string; slug: string }> },
) {
  const { locale, slug } = await params;
  const markdown =
    locale === CONTENT_LOCALE ? contentPageMarkdown(slug) : undefined;
  if (!markdown) {
    return new Response("Not found", { status: 404 });
  }
  return new Response(markdown, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      Vary: "Accept",
    },
  });
}
