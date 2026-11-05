import { motion, useReducedMotion } from 'framer-motion'

/**
 * Decorative looping scene for the auth hero panels: someone rewrites their CV,
 * doubts it, scraps it, and starts again (filename v1 → v2 → v7).
 *
 * One 16s loop = three failed attempts, then a happy ending (clean CV, check
 * stamp, confetti, smiling face). Every animated element is a keyframe track on
 * the same shared timeline, so everything stays in sync with no JS timers and
 * only transform/opacity/pathLength ever animate.
 */

const DURATION = 16
const ATTEMPTS = 3
const UNITS = ATTEMPTS + 1 // three attempts + the happy ending

// Local timeline of one attempt (0..1).
//   0 hidden · 1 paper in · 2 text written · 3 scribbled out · 4 crumple
//   5 arc apex · 6 lands in bin · 7 gone · 8 reset
const U = [0, 0.04, 0.4, 0.55, 0.62, 0.78, 0.9, 0.93, 1]

// Local timeline of the happy ending (0..1).
//   0 hidden · 1 clean page in · 2 written + check pops · 3 hold · 4 reset
const S = [0, 0.12, 0.3, 0.85, 1]

const TIMES = [
  ...Array.from({ length: ATTEMPTS }, (_, a) =>
    U.map((u) => (a + u) / UNITS)
  ).flat(),
  ...S.map((u) => (ATTEMPTS + u) / UNITS),
]

/** attempt track repeated for every attempt, then the happy-ending track. */
const track = <T,>(attempt: T[], happy: T[]) => [
  ...Array.from({ length: ATTEMPTS }, () => attempt).flat(),
  ...happy,
]

const transition = {
  duration: DURATION,
  times: TIMES,
  repeat: Infinity,
  ease: 'easeInOut' as const,
}

const FILENAMES = [
  'CV.docx',
  'CV_final_v2.docx',
  'CV_FINAL_final_v7.docx',
  'CV uploaded',
]

// Balls land in the bin on attempt a and stay until the loop resets.
const BALLS = [
  { cx: 392, cy: 152 },
  { cx: 418, cy: 152 },
  { cx: 405, cy: 134 },
]

const CONFETTI = [
  { dx: -34, dy: -44, r: 140, className: 'fill-primary' },
  { dx: 6, dy: -62, r: -120, className: 'fill-foreground' },
  { dx: 44, dy: -38, r: 200, className: 'fill-primary/50' },
  { dx: 62, dy: 6, r: -160, className: 'fill-primary' },
  { dx: 38, dy: 44, r: 120, className: 'fill-foreground' },
  { dx: -50, dy: -8, r: -200, className: 'fill-primary/50' },
]

const LINES = [
  'M166 90 H252',
  'M166 108 H238',
  'M166 126 H254',
  'M166 144 H226',
  'M166 162 H246',
]

export function CvRewriteScene({ className }: { className?: string }) {
  const reduced = useReducedMotion()

  const paper = reduced
    ? { initial: { opacity: 1 } }
    : {
        animate: {
          opacity: track([0, 1, 1, 1, 1, 1, 1, 0, 0], [0, 1, 1, 1, 0]),
          x: track([0, 0, 0, 0, 0, 100, 195, 195, 0], [0, 0, 0, 0, 0]),
          y: track([12, 0, 0, 0, 0, -90, 12, 12, 12], [12, 0, 0, 0, 0]),
          rotate: track([0, 0, 0, 0, 8, 120, 260, 260, 0], [0, 0, 0, 0, 0]),
          scale: track([1, 1, 1, 1, 0.6, 0.45, 0.4, 0.4, 1], [1, 1, 1, 1, 1]),
        },
        transition,
      }

  const write = reduced
    ? { initial: { pathLength: 1 } }
    : {
        animate: {
          pathLength: track([0, 0, 1, 1, 1, 1, 1, 1, 0], [0, 0, 1, 1, 1]),
          opacity: track([0, 0, 1, 1, 1, 1, 1, 1, 0], [0, 0, 1, 1, 1]),
        },
        transition,
      }

  const strike = reduced
    ? { initial: { pathLength: 0, opacity: 0 } }
    : {
        animate: {
          pathLength: track([0, 0, 0, 1, 1, 1, 1, 1, 0], [0, 0, 0, 0, 0]),
          opacity: track([0, 0, 0, 1, 1, 1, 1, 1, 0], [0, 0, 0, 0, 0]),
        },
        transition,
      }

  const pencil = reduced
    ? { initial: { opacity: 0 } }
    : {
        animate: {
          opacity: track([0, 1, 1, 1, 0, 0, 0, 0, 0], [0, 1, 0, 0, 0]),
          x: track([0, 0, 78, 20, 20, 20, 20, 20, 0], [0, 0, 78, 78, 0]),
          y: track([0, 0, 70, 6, 6, 6, 6, 6, 0], [0, 0, 70, 70, 0]),
        },
        transition,
      }

  const head = reduced
    ? { initial: { rotate: 0 } }
    : {
        animate: {
          rotate: track([0, 0, 0, 0, -9, -9, -4, 0, 0], [0, 0, 0, 0, 0]),
          y: track([0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, -10, 0, 0]),
        },
        transition,
      }

  // crossfade between the worried and the happy face
  const sadFace = reduced
    ? { initial: { opacity: 0 } }
    : {
        animate: {
          opacity: track([1, 1, 1, 1, 1, 1, 1, 1, 1], [1, 1, 0, 0, 1]),
        },
        transition,
      }

  const happyFace = reduced
    ? { initial: { opacity: 1 } }
    : {
        animate: {
          opacity: track([0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 1, 1, 0]),
        },
        transition,
      }

  const check = reduced
    ? { initial: { opacity: 1, scale: 1 } }
    : {
        animate: {
          opacity: track([0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 1, 1, 0]),
          scale: track([0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 1.25, 1, 0]),
        },
        transition,
      }

  const question = reduced
    ? { initial: { opacity: 1, scale: 1 } }
    : {
        animate: {
          opacity: track([0, 0, 0, 0, 1, 1, 1, 0, 0], [0, 0, 0, 0, 0]),
          scale: track(
            [0.2, 0.2, 0.2, 0.2, 1.15, 1, 1, 0.2, 0.2],
            [0.2, 0.2, 0.2, 0.2, 0.2]
          ),
        },
        transition,
      }

  const sweat = reduced
    ? { initial: { opacity: 0 } }
    : {
        animate: {
          opacity: track([0, 0, 0, 0, 1, 1, 0, 0, 0], [0, 0, 0, 0, 0]),
          y: track([0, 0, 0, 0, 0, 10, 14, 14, 0], [0, 0, 0, 0, 0]),
        },
        transition,
      }

  return (
    <svg
      viewBox='0 0 480 250'
      fill='none'
      aria-hidden='true'
      focusable='false'
      className={className}
    >
      {/* desk */}
      <path
        d='M16 215 H464'
        className='stroke-foreground'
        strokeWidth='3'
        strokeLinecap='round'
      />

      {/* person: flat, geometric */}
      <path
        d='M30 215 C30 172 52 158 70 158 C88 158 110 172 110 215 Z'
        className='fill-primary stroke-foreground'
        strokeWidth='3'
        strokeLinejoin='round'
      />
      <motion.g {...head} style={{ transformOrigin: '70px 170px' }}>
        <circle
          cx='70'
          cy='120'
          r='36'
          className='fill-card stroke-foreground'
          strokeWidth='3'
        />
        <motion.g {...sadFace}>
          <circle cx='57' cy='116' r='3.5' className='fill-foreground' />
          <circle cx='83' cy='116' r='3.5' className='fill-foreground' />
          <path
            d='M54 138 q4 -6 8 0 t8 0 t8 0'
            className='stroke-foreground'
            strokeWidth='3'
            strokeLinecap='round'
          />
          <path
            d='M50 103 l12 -4 M90 103 l-12 -4'
            className='stroke-foreground'
            strokeWidth='3'
            strokeLinecap='round'
          />
        </motion.g>
        <motion.g {...happyFace}>
          <path
            d='M49 118 q8 -10 16 0 M75 118 q8 -10 16 0'
            className='stroke-foreground'
            strokeWidth='3'
            strokeLinecap='round'
          />
          <path
            d='M52 130 Q70 156 88 130 Z'
            className='fill-primary stroke-foreground'
            strokeWidth='3'
            strokeLinejoin='round'
          />
          <circle cx='44' cy='130' r='6' className='fill-primary/25' />
          <circle cx='96' cy='130' r='6' className='fill-primary/25' />
        </motion.g>
      </motion.g>

      <motion.path
        {...sweat}
        d='M112 96 q-7 10 0 14 q7 -4 0 -14 Z'
        className='fill-primary/60'
      />

      {/* "?" bubble */}
      <motion.g
        {...question}
        style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
      >
        <circle
          cx='62'
          cy='52'
          r='22'
          className='fill-accent stroke-primary'
          strokeWidth='3'
        />
        <text
          x='62'
          y='62'
          textAnchor='middle'
          className='fill-primary font-black'
          fontSize='30'
        >
          ?
        </text>
      </motion.g>

      {/* the page being rewritten */}
      <motion.g
        {...paper}
        style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
      >
        <rect
          x='150'
          y='64'
          width='120'
          height='146'
          rx='10'
          className='fill-card stroke-foreground'
          strokeWidth='3'
        />
        {LINES.map((d) => (
          <motion.path
            key={d}
            {...write}
            d={d}
            className='stroke-primary'
            strokeWidth='5'
            strokeLinecap='round'
          />
        ))}
        <motion.path
          {...strike}
          d='M160 84 L262 170 M262 84 L160 170'
          className='stroke-destructive'
          strokeWidth='4'
          strokeLinecap='round'
        />
        <motion.g {...pencil}>
          <path
            d='M160 98 L186 72'
            className='stroke-foreground'
            strokeWidth='6'
            strokeLinecap='round'
          />
          <path
            d='M160 98 l-5 5'
            className='stroke-primary'
            strokeWidth='4'
            strokeLinecap='round'
          />
        </motion.g>
      </motion.g>

      {/* success stamp + confetti */}
      <motion.g
        {...check}
        style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
      >
        <circle
          cx='270'
          cy='64'
          r='20'
          className='fill-primary stroke-foreground'
          strokeWidth='3'
        />
        <path
          d='M261 64 l7 8 l13 -15'
          className='stroke-primary-foreground'
          strokeWidth='4'
          strokeLinecap='round'
          strokeLinejoin='round'
        />
      </motion.g>
      {CONFETTI.map((c, i) => (
        <motion.rect
          key={i}
          x='268'
          y='62'
          width='7'
          height='7'
          rx='2'
          className={c.className}
          {...(reduced
            ? { initial: { opacity: 0 } }
            : {
                animate: {
                  opacity: track(Array(9).fill(0), [0, 0, 1, 0, 0]),
                  x: track(Array(9).fill(0), [0, 0, 0, c.dx, c.dx]),
                  y: track(Array(9).fill(0), [0, 0, 0, c.dy, c.dy]),
                  rotate: track(Array(9).fill(0), [0, 0, 0, c.r, c.r]),
                },
                transition,
              })}
        />
      ))}

      {/* filename tags: v1 → v2 → v7 → uploaded */}
      {FILENAMES.map((name, a) => (
        <motion.g
          key={name}
          {...(reduced
            ? { initial: { opacity: a === ATTEMPTS ? 1 : 0 } }
            : {
                animate: {
                  opacity:
                    a === ATTEMPTS ? [0, 0, 0, 1, 1, 0, 0] : [0, 0, 1, 1, 0, 0],
                },
                transition: {
                  duration: DURATION,
                  ease: 'easeInOut' as const,
                  repeat: Infinity,
                  times: (a === ATTEMPTS
                    ? [0.1, 0.2, 0.3, 0.88, 0.95]
                    : [0.03, 0.07, 0.6, 0.66]
                  )
                    .map((u) => (a + u) / UNITS)
                    .reduce<number[]>((acc, t) => [...acc, t], [0])
                    .concat(1),
                },
              })}
        >
          <rect
            x='120'
            y='22'
            width='190'
            height='26'
            rx='13'
            className='fill-primary'
          />
          {a === ATTEMPTS && (
            <path
              d='M138 36 l5 5 l9 -10'
              className='stroke-primary-foreground'
              strokeWidth='2.5'
              strokeLinecap='round'
              strokeLinejoin='round'
            />
          )}
          <text
            x='215'
            y='39.5'
            textAnchor='middle'
            fontSize='12'
            fontFamily='ui-monospace, SFMono-Regular, Menlo, monospace'
            className='fill-primary-foreground font-semibold'
          >
            {name}
          </text>
        </motion.g>
      ))}

      {/* bin + the pile of scrapped drafts */}
      {BALLS.map((b, a) => {
        const s = (a + 0.9) / UNITS
        return (
          <motion.circle
            key={a}
            cx={b.cx}
            cy={b.cy}
            r='13'
            className='fill-card stroke-foreground'
            strokeWidth='3'
            {...(reduced
              ? { initial: { opacity: 1 } }
              : {
                  animate: { opacity: [0, 0, 1, 1, 0] },
                  transition: {
                    duration: DURATION,
                    ease: 'linear' as const,
                    repeat: Infinity,
                    times: [0, s, s + 0.02, 0.96, 1],
                  },
                })}
          />
        )
      })}
      <path
        d='M364 150 H446 L436 215 H374 Z'
        className='fill-muted stroke-foreground'
        strokeWidth='3'
        strokeLinejoin='round'
      />
      <path
        d='M386 164 V204 M405 164 V204 M424 164 V204'
        className='stroke-muted-foreground/50'
        strokeWidth='3'
        strokeLinecap='round'
      />
    </svg>
  )
}
