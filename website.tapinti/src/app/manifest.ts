import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ApplyLadder — The Personal Career CRM",
    short_name: "ApplyLadder",
    description:
      "Organize your career. Track every company, recruiter, application, resume, interview and follow-up in one place.",
    start_url: "/",
    display: "standalone",
    background_color: "#FAF9F7",
    theme_color: "#FAF9F7",
    icons: [
      {
        src: "/icon",
        sizes: "32x32",
        type: "image/png",
      },
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}
