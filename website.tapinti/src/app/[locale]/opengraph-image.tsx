import { ImageResponse } from "next/og";

export const alt = "ApplyLadder — the Personal Career CRM";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Latin-only copy on purpose: Satori needs a bundled font for fa/ar glyphs,
// and the same card works for every locale.
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 96,
          background: "#FAF9F7",
          color: "#14201A",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 20,
            fontSize: 44,
            fontWeight: 700,
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 16,
              background: "#177C49",
            }}
          />
          ApplyLadder
        </div>
        <div
          style={{
            marginTop: 48,
            fontSize: 84,
            fontWeight: 700,
            lineHeight: 1.05,
            letterSpacing: -2,
          }}
        >
          Organize Your Career. Land Your Next Job.
        </div>
        <div style={{ marginTop: 36, fontSize: 36, color: "#177C49" }}>
          The Personal Career CRM
        </div>
      </div>
    ),
    { ...size },
  );
}
