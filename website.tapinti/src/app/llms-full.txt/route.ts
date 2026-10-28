import { pageMarkdown } from "@/lib/content";

export const dynamic = "force-static";

export async function GET() {
  return new Response(await pageMarkdown("en"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
