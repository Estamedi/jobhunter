import z from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ThemeSwitch } from '@/components/theme-switch'
import { CvBuilder } from '@/features/cv-builder'

const searchSchema = z.object({
  applicationId: z.coerce.number().int().positive().optional().catch(undefined),
  jobRoleId: z.coerce.number().int().positive().optional().catch(undefined),
})

function CvBuilderPage() {
  const { applicationId, jobRoleId } = Route.useSearch()

  return (
    <>
      <Header>
        <div className='ml-auto flex items-center gap-2'>
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>
      <Main>
        <div className='mb-4'>
          <h1 className='text-2xl font-bold tracking-tight'>CV Writer</h1>
          <p className='text-sm text-muted-foreground'>
            Write a CV tailored to a job with AI, refine it, and export it as
            PDF
          </p>
        </div>
        <CvBuilder applicationId={applicationId} jobRoleId={jobRoleId} />
      </Main>
    </>
  )
}

export const Route = createFileRoute('/_authenticated/cv-builder/')({
  validateSearch: searchSchema,
  component: CvBuilderPage,
})
