import { contentPageMarkdown, pageMarkdown } from "@/lib/content";
import { contentPages } from "@/content/pages";

export const dynamic = "force-static";

export async function GET() {
  const body = [
    await pageMarkdown("en"),
    ...contentPages.map((p) => contentPageMarkdown(p.slug)),
  ].join("\n---\n\n");

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
