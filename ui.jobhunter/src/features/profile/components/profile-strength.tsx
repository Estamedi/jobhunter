import { Check, Circle } from 'lucide-react'
import { type ProfileGap } from '@/features/cv-builder/lib/profile-check'
import { profileStrength } from '../lib/profile-strength'

// The side column: what is still missing from the profile, each with a button that goes to it.
export function ProfileStrength({
  gaps,
  onFix,
}: {
  gaps: ProfileGap[]
  onFix: (id: ProfileGap['id']) => void
}) {
  const { done, total, percent } = profileStrength(gaps)

  return (
    <>
      <section className='rounded-lg border bg-card p-5 text-card-foreground shadow-xs'>
        <h2 className='text-lg font-semibold'>Profile strength</h2>
        <p className='mt-1 text-sm text-muted-foreground'>
          {done} of {total} done
        </p>
        <div
          className='mt-2 h-2 overflow-hidden rounded-full bg-muted'
          role='progressbar'
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label='Profile strength'
        >
          <div
            className='h-full rounded-full bg-primary transition-all'
            style={{ width: `${percent}%` }}
          />
        </div>

        {gaps.length === 0 ? (
          <p className='mt-4 flex items-center gap-2 text-sm'>
            <Check className='h-4 w-4 text-primary' /> Your profile is complete.
          </p>
        ) : (
          <ul className='mt-4 space-y-2'>
            {gaps.map((gap) => (
              <li key={gap.id} className='flex items-start gap-2 text-sm'>
                <Circle className='mt-0.5 h-4 w-4 shrink-0 text-muted-foreground' />
                <span className='flex-1'>{gap.message}</span>
                <button
                  type='button'
                  className='font-semibold text-primary hover:underline'
                  onClick={() => onFix(gap.id)}
                >
                  Add
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  )
}
