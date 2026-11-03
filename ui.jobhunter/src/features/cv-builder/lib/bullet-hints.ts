// Hints shown under a bullet while it is typed. The limits match the rules the AI is given, so a
// hand edit is held to the same standard as a generated bullet.
export const MAX_BULLET_WORDS = 25

const WEAK_OPENERS = [
  'responsible for',
  'helped',
  'worked on',
  'assisted',
  'handled',
  'participated in',
]

export function bulletHints(bullet: string): string[] {
  const text = bullet.trim()
  if (!text) return []

  const hints: string[] = []
  const words = text.replace(/\*\*/g, '').split(/\s+/).filter(Boolean).length
  if (words > MAX_BULLET_WORDS) {
    hints.push(`${words} words: aim for ${MAX_BULLET_WORDS} or fewer`)
  }
  if (!/\d/.test(text)) {
    hints.push('No number: add one only if you have a real figure')
  }
  if ((text.match(/\*\*/g) ?? []).length % 2 !== 0) {
    hints.push('A ** bold marker is not closed')
  }
  const opener = text.replace(/\*\*/g, '').toLowerCase()
  const weak = WEAK_OPENERS.find(
    (w) => opener === w || opener.startsWith(`${w} `)
  )
  if (weak) {
    hints.push(`Starts with "${weak}": use a stronger, specific verb`)
  }
  return hints
}

// One entry per non-empty line of the editor's "one bullet per line" text.
export function bulletLineHints(
  bulletsText: string
): { line: number; text: string; hints: string[] }[] {
  return bulletsText
    .split('\n')
    .map((text, index) => ({
      line: index + 1,
      text: text.trim(),
      hints: bulletHints(text),
    }))
    .filter((l) => l.hints.length > 0)
}
