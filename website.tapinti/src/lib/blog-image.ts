import { existsSync } from "node:fs";
import { join } from "node:path";

/**
 * Article cover image: drop `public/blog/<slug>.webp` (1200x630) and it shows
 * up on the article and the blog index. Returns undefined until the file exists.
 */
export function getBlogImage(slug: string): string | undefined {
  const file = `${slug}.webp`;
  return existsSync(join(process.cwd(), "public", "blog", file))
    ? `/blog/${file}`
    : undefined;
}
