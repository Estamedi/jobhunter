import { describe, expect, it } from 'vitest'
import { bulletHints, bulletLineHints, MAX_BULLET_WORDS } from './bullet-hints'

describe('bulletHints', () => {
  it('has no hints for an empty line or a good bullet', () => {
    expect(bulletHints('')).toEqual([])
    expect(bulletHints('   ')).toEqual([])
    expect(
      bulletHints('Cut cloud costs by **30%** across 12 services.')
    ).toEqual([])
  })

  it('flags a bullet that is too long, counting words without bold markers', () => {
    const long =
      Array.from({ length: MAX_BULLET_WORDS + 1 }, (_, i) => `word${i}`).join(
        ' '
      ) + ' 5'
    expect(bulletHints(long)[0]).toContain('words')
    const ok =
      Array.from({ length: MAX_BULLET_WORDS - 1 }, (_, i) => `**w${i}**`).join(
        ' '
      ) + ' 5'
    expect(bulletHints(ok)).toEqual([])
  })

  it('flags a bullet with no number as a soft hint', () => {
    expect(bulletHints('Led the platform team.')).toEqual([
      'No number: add one only if you have a real figure',
    ])
  })

  it('flags a bold marker that is not closed', () => {
    expect(bulletHints('Built **Terraform modules for 3 teams.')).toContain(
      'A ** bold marker is not closed'
    )
    expect(bulletHints('Built **Terraform** modules for 3 teams.')).toEqual([])
  })

  it('flags a weak opener only at the start', () => {
    expect(bulletHints('Helped the team ship 3 releases.')).toContain(
      'Starts with "helped": use a stronger, specific verb'
    )
    expect(bulletHints('Responsible for 4 services.')[0]).toContain(
      'responsible for'
    )
    expect(bulletHints('Handled 40 tickets a day.')[0]).toContain('handled')
    expect(bulletHints('Shipped 3 releases that helped sales.')).toEqual([])
    expect(bulletHints('Helpdesk tooling cut tickets by 20%.')).toEqual([])
  })

  it('does not treat a weak opener inside bold text as a different word', () => {
    expect(bulletHints('**Helped** 3 teams.')[0]).toContain('helped')
  })
})

describe('bulletLineHints', () => {
  it('lists only the lines that have hints, with their line numbers', () => {
    const result = bulletLineHints(
      'Cut costs by 30%.\nLed the team.\n\nHelped 2 teams.'
    )

    expect(result.map((r) => r.line)).toEqual([2, 4])
    expect(result[0].text).toBe('Led the team.')
  })
})
