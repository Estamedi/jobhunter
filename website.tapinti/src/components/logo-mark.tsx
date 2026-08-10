import type { SVGProps } from "react";

/**
 * The "2a — fan" mark: three rounded-rect cards fanned out, two outlined
 * (the pile of applications) with the accent card in front (the live one).
 * Geometry matches the approved design spec 1:1 (viewBox mirrors its px grid).
 */
export function LogoMark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 84 62" fill="none" aria-hidden="true" {...props}>
      <rect
        x="3"
        y="13"
        width="50"
        height="36"
        rx="8"
        transform="rotate(-16 28 31)"
        className="fill-background stroke-foreground"
        strokeWidth="3"
      />
      <rect
        x="17"
        y="11.56"
        width="50"
        height="36"
        rx="8"
        transform="rotate(-2 42 29.56)"
        className="fill-background stroke-foreground"
        strokeWidth="3"
      />
      <rect
        x="31"
        y="14.44"
        width="50"
        height="36"
        rx="8"
        transform="rotate(13 56 32.44)"
        className="fill-brand-green"
      />
    </svg>
  );
}
