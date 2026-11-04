import { useRef } from 'react'
import { Camera, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function PhotoCard({
  photoUrl,
  isLoading,
  isBusy,
  onPick,
  onRemove,
}: {
  photoUrl: string | null
  isLoading: boolean
  isBusy: boolean
  onPick: (file: File) => void
  onRemove: () => void
}) {
  const input = useRef<HTMLInputElement>(null)

  return (
    <section className='rounded-md border p-5'>
      <h2 className='mb-3 text-xl font-semibold'>Photo</h2>

      <div className='flex flex-wrap items-center gap-4'>
        <div
          className='flex h-40 w-[7.5rem] items-center justify-center overflow-hidden rounded border bg-muted text-xs text-muted-foreground'
          aria-label={photoUrl ? 'Your CV photo' : 'No photo yet'}
        >
          {photoUrl ? (
            <img
              src={photoUrl}
              alt='Your CV photo'
              className='h-full w-full object-cover'
            />
          ) : (
            <span>{isLoading ? 'Loading…' : 'No photo yet'}</span>
          )}
        </div>

        <div className='space-y-2'>
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
              if (file) onPick(file)
            }}
          />
          <Button
            type='button'
            variant='outline'
            disabled={isBusy}
            onClick={() => input.current?.click()}
          >
            <Camera className='mr-1 h-4 w-4' />{' '}
            {photoUrl ? 'Change photo' : 'Upload photo'}
          </Button>
          {photoUrl && (
            <Button
              type='button'
              variant='ghost'
              className='text-destructive'
              disabled={isBusy}
              onClick={onRemove}
            >
              <Trash2 className='mr-1 h-4 w-4' /> Remove
            </Button>
          )}
          <p className='max-w-xs text-xs text-muted-foreground'>
            Used only by the &ldquo;With photo&rdquo; CV template. It is cropped
            to a portrait. Only you can see it, and it is never sent to the AI.
          </p>
        </div>
      </div>
    </section>
  )
}
