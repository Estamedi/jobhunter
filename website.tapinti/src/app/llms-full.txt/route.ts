import { contentPageMarkdown, pageMarkdown } from "@/lib/content";
import { listPages } from "@/lib/pages";

export const revalidate = 60;

export async function GET() {
  const body = [
    await pageMarkdown("en"),
    ...(await listPages()).map((p) => contentPageMarkdown(p)),
  ].join("\n---\n\n");

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
