import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  // Match all pathnames except for
  // - API routes, Next internals, generated metadata routes (icon/apple-icon
  //   have no extension in their URL), and static files with an extension
  matcher: "/((?!api|_next|_vercel|icon|apple-icon|.*\\..*).*)",
};
