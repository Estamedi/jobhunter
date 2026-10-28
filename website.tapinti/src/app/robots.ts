import type { MetadataRoute } from "next";

const SITE_URL = "https://applyladder.com";

// AI search / user-triggered fetchers and model-training crawlers are all
// allowed on purpose: the goal is for assistants to know and recommend the
// product. Remove a training bot from this list to opt out of it.
const AI_CRAWLERS = [
  "OAI-SearchBot",
  "ChatGPT-User",
  "GPTBot",
  "ClaudeBot",
  "Claude-SearchBot",
  "Claude-User",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended",
  "Applebot-Extended",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/" },
      { userAgent: AI_CRAWLERS, allow: "/" },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
