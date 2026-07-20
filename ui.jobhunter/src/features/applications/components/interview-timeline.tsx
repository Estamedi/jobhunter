import { format, isPast } from 'date-fns'
import { CalendarClock, ExternalLink, Mail, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import type { JobInterview } from '@/features/interviews/api'

const STATUS_COLORS: Record<string, 'default' | 'secondary' | 'destructive'> = {
  Scheduled: 'default',
  Completed: 'secondary',
  Cancelled: 'destructive',
  Rescheduled: 'default',
  NoShow: 'destructive',
}

export function InterviewTimeline({ interviews }: { interviews: JobInterview[] }) {
  if (interviews.length === 0) {
    return (
      <div className='rounded-xl border border-dashed p-4 text-center text-sm text-muted-foreground'>
        No interviews scheduled yet for this application.
      </div>
    )
  }

  const sorted = [...interviews].sort((a, b) => new Date(a.interviewDate).getTime() - new Date(b.interviewDate).getTime())

  return (
    <ol className='space-y-5'>
      {sorted.map((iv, i) => {
        const date = new Date(iv.interviewDate)
        const past = isPast(date) && iv.status === 'Scheduled'

        return (
          <li key={iv.id} className='relative flex gap-3 ps-1'>
            <div className='flex flex-col items-center'>
              <span
                className={cn(
                  'flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
                  iv.status === 'Completed' && 'bg-emerald-500 text-white',
                  iv.status === 'Cancelled' || iv.status === 'NoShow' ? 'bg-muted text-muted-foreground' : '',
                  iv.status === 'Scheduled' || iv.status === 'Rescheduled' ? 'bg-violet-500 text-white' : ''
                )}
              >
                {i + 1}
              </span>
              {i < sorted.length - 1 && <span className='mt-1 w-0.5 flex-1 rounded bg-border' />}
            </div>
            <div className='min-w-0 flex-1 pb-1'>
              <div className='flex flex-wrap items-center gap-2'>
                <span className='text-sm font-semibold'>{iv.round} interview</span>
                <Badge variant={STATUS_COLORS[iv.status] ?? 'secondary'} className='text-[10px]'>
                  {iv.status}
                </Badge>
                {past && <span className='text-[10px] font-medium text-amber-600'>needs an update</span>}
              </div>
              <div className='mt-1 flex items-center gap-1.5 text-xs text-muted-foreground'>
                <CalendarClock className='size-3.5' />
                {format(date, 'MMM d, yyyy · h:mm a')}
                {iv.durationMinutes && <span>· {iv.durationMinutes} min</span>}
              </div>
              {iv.interviewerName && (
                <div className='mt-1 flex items-center gap-1.5 text-xs text-muted-foreground'>
                  <User className='size-3.5' />
                  {iv.interviewerName}
                  {iv.interviewerEmail && (
                    <a href={`mailto:${iv.interviewerEmail}`} className='inline-flex items-center gap-1 text-violet-600 hover:underline dark:text-violet-400'>
                      <Mail className='size-3' />
                      {iv.interviewerEmail}
                    </a>
                  )}
                </div>
              )}
              {iv.meetingLink && (
                <a
                  href={iv.meetingLink}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='mt-1 inline-flex items-center gap-1 text-xs font-medium text-violet-600 hover:underline dark:text-violet-400'
                >
                  Join meeting <ExternalLink className='size-3' />
                </a>
              )}
              {iv.preparationNotes && (
                <p className='mt-2 rounded-lg bg-muted/50 p-2 text-xs text-muted-foreground'>{iv.preparationNotes}</p>
              )}
              {iv.feedback && (
                <p className='mt-2 text-xs text-muted-foreground'>
                  <span className='font-medium text-foreground'>Feedback: </span>
                  {iv.feedback}
                </p>
              )}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
