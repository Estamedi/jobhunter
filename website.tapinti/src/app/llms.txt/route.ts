import { llmsIndex } from "@/lib/content";

export const revalidate = 60;

export async function GET() {
  return new Response(await llmsIndex(), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
