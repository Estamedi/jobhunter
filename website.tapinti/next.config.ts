import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

// Cover images uploaded in the CMS are served through this site, so the CMS needs no public address.
// The target is fixed at build time; the default is the CMS container on the server.
const CMS_URL = process.env.CMS_URL ?? "http://tapinti-cms:1337";

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
      afterFiles: [
        { source: "/cms-uploads/:path*", destination: `${CMS_URL}/uploads/:path*` },
      ],
      fallback: [],
    };
  },
};

export default withNextIntl(nextConfig);
