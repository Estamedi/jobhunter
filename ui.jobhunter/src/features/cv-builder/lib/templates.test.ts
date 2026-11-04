import { describe, expect, it } from 'vitest'
import { CV_TEMPLATES, templateLabel, templateLook } from './templates'

describe('templateLook', () => {
  it('keeps the classic look for the classic id, a missing id and an unknown id', () => {
    const classic = templateLook('classic')
    expect(classic.vars['--cv-heading']).toBe('#4285F4')
    expect(templateLook(undefined)).toBe(classic)
    expect(templateLook(null)).toBe(classic)
    expect(templateLook('does-not-exist')).toBe(classic)
  })

  it('uses near-black headings for print and tighter spacing for compact', () => {
    expect(templateLook('neutral').vars['--cv-heading']).toBe('#1F1F1F')
    expect(templateLook('neutral').fontSize).toBe(
      templateLook('classic').fontSize
    )
    const compact = templateLook('compact')
    expect(compact.vars['--cv-heading']).toBe('#1F1F1F')
    expect(compact.vars['--cv-block']).toBe('8px')
    expect(parseFloat(compact.fontSize)).toBeLessThan(
      parseFloat(templateLook('classic').fontSize)
    )
  })

  it('draws the photo header only for the photo template, with the classic colours', () => {
    expect(templateLook('photo').photoHeader).toBe(true)
    expect(templateLook('photo').vars).toEqual(templateLook('classic').vars)
    for (const id of ['classic', 'neutral', 'compact', 'nope', undefined]) {
      expect(templateLook(id).photoHeader).toBe(false)
    }
  })

  it('has a look for every template in the list', () => {
    for (const t of CV_TEMPLATES) {
      expect(Object.keys(templateLook(t.id).vars).length).toBeGreaterThan(0)
    }
  })
})

describe('templateLabel', () => {
  it('names a template and falls back to the first one', () => {
    expect(templateLabel('neutral')).toBe('Classic for print')
    expect(templateLabel('compact')).toBe('Compact')
    expect(templateLabel('photo')).toBe('With photo')
    expect(templateLabel('nope')).toBe('Classic')
  })
})
