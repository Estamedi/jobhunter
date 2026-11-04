import '@/styles/index.css'
import { describe, expect, it } from 'vitest'
import { render } from 'vitest-browser-react'
import { type CvContent } from '../api'
import { CvPreview } from './cv-preview'

const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
]

function cvStartedMonthsAgo(months: number, endDate?: string): CvContent {
  const d = new Date()
  d.setDate(1)
  d.setMonth(d.getMonth() - months)
  return {
    headline: 'Engineer',
    summary: '',
    skills: [],
    projects: [],
    experience: [
      {
        role: 'Lead',
        company: 'Acme',
        startDate: `${MONTHS[d.getMonth()]} ${d.getFullYear()}`,
        endDate,
        bullets: ['Cut costs by 30%.'],
      },
    ],
    education: [],
    certifications: [],
    languages: [],
    links: [],
  }
}

describe('CvPreview dates', () => {
  it.each([['Present'], ['present'], [undefined]])(
    'shows how long a current role has lasted when the end date is %s',
    async (end) => {
      const screen = await render(
        <CvPreview
          header={{ fullName: 'Alex Example' }}
          content={cvStartedMonthsAgo(13, end)}
        />
      )

      await expect.element(screen.getByText(/1 yr 2 mos/)).toBeVisible()
    }
  )

  it('shows how long an ended role lasted', async () => {
    const content = cvStartedMonthsAgo(40, 'Jan 2020')
    content.experience[0].startDate = 'Jan 2018'
    const screen = await render(
      <CvPreview header={{ fullName: 'Alex Example' }} content={content} />
    )

    await expect.element(screen.getByText(/2 yrs/)).toBeVisible()
  })
})
