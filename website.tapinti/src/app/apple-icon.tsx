import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// Design spec §03 "App icon": Ink ground, three-card fan (two white outline,
// one filled with the brighter "Signal / dark UI" green oklch(0.62 0.14 155),
// pre-converted to sRGB hex since Satori's color parsing shouldn't be
// trusted with oklch()). No corner radius — iOS applies its own mask.
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          background: "#16171B",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            position: "relative",
            width: 135,
            height: 101,
            display: "flex",
          }}
        >
          <div
            style={{
              position: "absolute",
              left: 6.2,
              top: 19.7,
              width: 79,
              height: 62,
              borderRadius: 17,
              border: "8.4px solid #FAF9F7",
              transform: "rotate(-16deg)",
            }}
          />
          <div
            style={{
              position: "absolute",
              left: 28.1,
              top: 17.4,
              width: 79,
              height: 62,
              borderRadius: 17,
              border: "8.4px solid #FAF9F7",
              background: "#16171B",
              transform: "rotate(-2deg)",
            }}
          />
          <div
            style={{
              position: "absolute",
              left: 50.1,
              top: 21.9,
              width: 79,
              height: 62,
              borderRadius: 17,
              background: "#279E60",
              transform: "rotate(13deg)",
            }}
          />
        </div>
      </div>
    ),
    { ...size },
  );
}
