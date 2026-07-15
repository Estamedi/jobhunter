import { createFileRoute } from '@tanstack/react-router'
import { Notes } from '@/features/notes'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ThemeSwitch } from '@/components/theme-switch'
import { ProfileDropdown } from '@/components/profile-dropdown'

function NotesPage() {
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
          <h1 className='text-2xl font-bold tracking-tight'>Notes</h1>
          <p className='text-muted-foreground text-sm'>Jot down and manage notes, optionally linked to applications</p>
        </div>
        <Notes />
      </Main>
    </>
  )
}

export const Route = createFileRoute('/_authenticated/notes/')({
  component: NotesPage,
})
