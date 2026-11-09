import { CONTENT_LOCALE, contentPages } from "@/content/pages";
import { contentPageMarkdown } from "@/lib/content";
import { getPage } from "@/lib/pages";

export const revalidate = 60;
export const dynamicParams = true;

export function generateStaticParams() {
  return contentPages.map((p) => ({ locale: CONTENT_LOCALE, slug: p.slug }));
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ locale: string; slug: string }> },
) {
  const { locale, slug } = await params;
  const page = locale === CONTENT_LOCALE ? await getPage(slug) : undefined;
  if (!page) {
    return new Response("Not found", { status: 404 });
  }
  return new Response(contentPageMarkdown(page), {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      Vary: "Accept",
    },
  });
}
