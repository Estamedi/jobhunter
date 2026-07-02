import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Tapinti — The Personal Career CRM",
    short_name: "Tapinti",
    description:
      "Organize your career. Track every company, recruiter, application, resume, interview and follow-up in one place.",
    start_url: "/",
    display: "standalone",
    background_color: "#05060f",
    theme_color: "#4f46e5",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
    ],
  };
}
