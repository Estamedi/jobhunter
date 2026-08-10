import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

// Same "2a — fan" mark as the site logo, rendered for the browser tab icon.
// Positions are the same fan geometry as the design spec, converted from
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
          background: "#16171B",
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
              left: 1.1,
              top: 3.5,
              width: 14,
              height: 11,
              borderRadius: 3,
              border: "1.5px solid #FAF9F7",
              transform: "rotate(-16deg)",
            }}
          />
          <div
            style={{
              position: "absolute",
              left: 5,
              top: 3.1,
              width: 14,
              height: 11,
              borderRadius: 3,
              border: "1.5px solid #FAF9F7",
              background: "#16171B",
              transform: "rotate(-2deg)",
            }}
          />
          <div
            style={{
              position: "absolute",
              left: 8.9,
              top: 3.9,
              width: 14,
              height: 11,
              borderRadius: 3,
              background: "#177C49",
              transform: "rotate(13deg)",
            }}
          />
        </div>
      </div>
    ),
    { ...size },
  );
}
