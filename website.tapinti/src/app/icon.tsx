import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

// Design spec §03 "Favicon": Signal-green ground, two white cards (outline +
// solid) — distinct from the Ink-ground three-card "App icon" treatment used
// by apple-icon.tsx. Positions are the fan geometry converted from
// percentage-based transforms to explicit px offsets (Satori's CSS subset
// doesn't reliably support combined percentage-translate + rotate).
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: "#177C49",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            position: "relative",
            width: 24,
            height: 18,
            display: "flex",
          }}
        >
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 3.5,
              width: 15,
              height: 11,
              borderRadius: 3,
              border: "1.6px solid #FFFFFF",
              transform: "rotate(-16deg)",
            }}
          />
          <div
            style={{
              position: "absolute",
              left: 8,
              top: 4,
              width: 15,
              height: 11,
              borderRadius: 3,
              background: "#FFFFFF",
              transform: "rotate(13deg)",
            }}
          />
        </div>
      </div>
    ),
    { ...size },
  );
}
