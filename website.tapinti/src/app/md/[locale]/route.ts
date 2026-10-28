import { routing } from "@/i18n/routing";
import { isLocale, pageMarkdown } from "@/lib/content";

export const dynamic = "force-static";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ locale: string }> },
) {
  const { locale } = await params;
  if (!isLocale(locale)) {
    return new Response("Not found", { status: 404 });
  }
  return new Response(await pageMarkdown(locale), {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      Vary: "Accept",
    },
  });
}
