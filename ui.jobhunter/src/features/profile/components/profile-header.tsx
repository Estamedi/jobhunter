import { useImperativeHandle, useRef, type Ref } from 'react'
import { Link } from '@tanstack/react-router'
import {
  Building2,
  Camera,
  FileUp,
  GraduationCap,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
  Upload,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { initialsOf } from '../lib/profile-summary'

interface AddSectionOption {
  key: string
  label: string
}

// The top card of the profile, like a LinkedIn intro: a banner, a round photo that overlaps it, the name,
// the headline, the place with a "Contact info" link, and the current company and school on the side.
export interface ProfileHeaderHandle {
  openPhotoPicker: () => void
}

export function ProfileHeader({
  ref,
  fullName,
  headline,
  location,
  availability,
  photoUrl,
  photoLoading,
  photoBusy,
  role,
  school,
  addSections,
  onPickPhoto,
  onRemovePhoto,
  onEditIntro,
  onOpenContact,
  onImport,
  onAddSection,
}: {
  // Lets the page open the photo picker, for the checklist's "add a photo".
  ref?: Ref<ProfileHeaderHandle>
  fullName: string
  headline?: string | null
  location?: string | null
  availability?: string | null
  photoUrl: string | null
  photoLoading: boolean
  photoBusy: boolean
  role: { title: string; company: string } | null
  school: string | null
  addSections: AddSectionOption[]
  onPickPhoto: (file: File) => void
  onRemovePhoto: () => void
  onEditIntro: () => void
  onOpenContact: () => void
  onImport: () => void
  onAddSection: (key: string) => void
}) {
  const input = useRef<HTMLInputElement>(null)
  useImperativeHandle(
    ref,
    () => ({ openPhotoPicker: () => input.current?.click() }),
    []
  )

  return (
    <section className='overflow-hidden rounded-lg border bg-card text-card-foreground shadow-xs'>
      <div
        className='h-28 bg-linear-to-r from-primary/40 via-primary/20 to-primary/5 sm:h-36'
        aria-hidden
      />

      <div className='relative px-5 pb-5 sm:px-6'>
        <input
          ref={input}
          type='file'
          accept='image/jpeg,image/png,image/webp'
          className='hidden'
          data-testid='photo-input'
          onChange={(e) => {
            const file = e.target.files?.[0]
            // Lets the same file be picked again after a failed upload.
            e.target.value = ''
            if (file) onPickPhoto(file)
          }}
        />

        <div className='relative -mt-14 h-28 w-28 sm:-mt-20 sm:h-36 sm:w-36'>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type='button'
                disabled={photoBusy}
                aria-label='Change profile photo'
                title='Change profile photo'
                className='group relative block h-full w-full overflow-hidden rounded-full border-4 border-card bg-muted shadow-sm focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60'
              >
                {photoUrl ? (
                  <img
                    src={photoUrl}
                    alt='Your profile photo'
                    className='h-full w-full object-cover object-[center_25%]'
                  />
                ) : (
                  <span className='flex h-full w-full items-center justify-center text-3xl font-semibold text-muted-foreground sm:text-4xl'>
                    {photoLoading ? '' : initialsOf(fullName)}
                  </span>
                )}
                <span className='absolute inset-0 flex items-center justify-center bg-black/40 text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100'>
                  <Camera className='h-6 w-6' />
                </span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='start'>
              <DropdownMenuLabel className='max-w-56 text-xs font-normal text-muted-foreground'>
                Used on the &ldquo;With photo&rdquo; CV. Cropped to a portrait,
                visible only to you, and never sent to the AI.
              </DropdownMenuLabel>
              <DropdownMenuItem onSelect={() => input.current?.click()}>
                <Upload className='me-2 h-4 w-4' />
                {photoUrl ? 'Change photo' : 'Upload photo'}
              </DropdownMenuItem>
              {photoUrl && (
                <DropdownMenuItem
                  variant='destructive'
                  onSelect={() => onRemovePhoto()}
                >
                  <Trash2 className='me-2 h-4 w-4' />
                  Remove photo
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          {/* Always visible, so a touch screen can tell the photo can be changed. */}
          <span
            aria-hidden
            className='pointer-events-none absolute end-1 bottom-1 flex h-8 w-8 items-center justify-center rounded-full border bg-card text-muted-foreground shadow-sm'
          >
            <Camera className='h-4 w-4' />
          </span>
        </div>

        <Button
          variant='ghost'
          size='icon'
          className='absolute end-3 top-3 rounded-full'
          title='Edit intro'
          aria-label='Edit intro'
          onClick={onEditIntro}
        >
          <Pencil className='h-4 w-4' />
        </Button>

        <div className='mt-3 grid gap-4 md:grid-cols-[minmax(0,1fr)_16rem]'>
          <div className='min-w-0'>
            <h1 className='text-2xl font-semibold break-words'>{fullName}</h1>
            <p className='mt-0.5 break-words'>
              {headline || (
                <button
                  type='button'
                  className='text-muted-foreground hover:underline'
                  onClick={onEditIntro}
                >
                  Add a headline
                </button>
              )}
            </p>
            <p className='mt-1 text-sm text-muted-foreground'>
              {location || 'No location yet'}
              {availability && <> · Available: {availability}</>}
              {' · '}
              <button
                type='button'
                className='font-semibold text-primary hover:underline'
                onClick={onOpenContact}
              >
                Contact info
              </button>
            </p>
          </div>

          {(role || school) && (
            <ul className='space-y-2 self-start text-sm font-semibold'>
              {role && (
                <li className='flex items-start gap-2'>
                  <Building2 className='mt-0.5 h-5 w-5 shrink-0 text-muted-foreground' />
                  <span className='break-words'>{role.company}</span>
                </li>
              )}
              {school && (
                <li className='flex items-start gap-2'>
                  <GraduationCap className='mt-0.5 h-5 w-5 shrink-0 text-muted-foreground' />
                  <span className='break-words'>{school}</span>
                </li>
              )}
            </ul>
          )}
        </div>

        <div className='mt-4 flex flex-wrap gap-2'>
          <Button className='rounded-full' onClick={onImport}>
            <FileUp className='me-1 h-4 w-4' /> Import from CV
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant='outline' className='rounded-full'>
                <Plus className='me-1 h-4 w-4' /> Add section
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='start'>
              {addSections.map((s) => (
                <DropdownMenuItem
                  key={s.key}
                  onSelect={() => onAddSection(s.key)}
                >
                  {s.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button asChild variant='outline' className='rounded-full'>
            <Link to='/cv-builder'>
              <Sparkles className='me-1 h-4 w-4' /> Write a tailored CV
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
