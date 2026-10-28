import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  async redirects() {
    // Permanent, so search engines treat /en as the canonical home page
    // (a 307 made Google pick "/" as canonical over "/en").
    return [{ source: "/", destination: "/en", permanent: true }];
  },
  async rewrites() {
    return {
      beforeFiles: [
        // /en.md -> markdown mirror of the page
        { source: "/:locale(en|fa|ar).md", destination: "/md/:locale" },
        { source: "/en/:slug.md", destination: "/md/en/:slug" },
        {
          source: "/en/:slug",
          has: [{ type: "header", key: "accept", value: "(.*)text/markdown(.*)" }],
          destination: "/md/en/:slug",
        },
        // Agents that ask for markdown get it from the normal URL
        {
          source: "/:locale(en|fa|ar)",
          has: [{ type: "header", key: "accept", value: "(.*)text/markdown(.*)" }],
          destination: "/md/:locale",
        },
      ],
      afterFiles: [],
      fallback: [],
    };
  },
};

export default withNextIntl(nextConfig);
