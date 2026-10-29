import { useQuery } from '@tanstack/react-query'
import { cn } from '@/lib/utils'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cvBuilderApi, type CvScoreLocation, type CvSection } from '../api'
import { jobFit } from '../lib/job-fit'
import { JobMatchPanel } from './job-match-panel'
import { ScorePanel } from './score-panel'

// Two separate questions about one CV: is it well written (the score), and does it cover this job (the job
// match). They are shown side by side so a high number on one never hides a low one on the other.
function Stat({
  label,
  value,
  note,
  tone,
}: {
  label: string
  value: string
  note: string
  tone?: string
}) {
  return (
    <div className='flex flex-1 flex-col gap-0.5 rounded-md border p-3'>
      <span className='text-xs text-muted-foreground'>{label}</span>
      <span className={cn('text-2xl leading-none font-semibold', tone)}>
        {value}
      </span>
      <span className='text-xs text-muted-foreground'>{note}</span>
    </div>
  )
}

const rate = (ratio: number) =>
  ratio >= 0.9
    ? 'text-green-600 dark:text-green-400'
    : ratio >= 0.6
      ? 'text-amber-600 dark:text-amber-400'
      : 'text-red-600 dark:text-red-400'

export function ReviewPanel({
  draftId,
  lastModified,
  hasJobDescription,
  candidateId,
  onRefine,
  onShowLines,
}: {
  draftId: number
  lastModified: string
  hasJobDescription: boolean
  candidateId: number
  onRefine: (section: CvSection, instruction: string) => void
  onShowLines: (locations: CvScoreLocation[]) => void
}) {
  // Same keys as the two tabs below, so these share their requests instead of repeating them.
  const score = useQuery({
    queryKey: ['cv-draft-score', draftId, lastModified],
    queryFn: () => cvBuilderApi.score(draftId),
    retry: false,
  })
  const match = useQuery({
    queryKey: ['cv-draft-match', draftId, lastModified],
    queryFn: () => cvBuilderApi.match(draftId),
    enabled: hasJobDescription,
    retry: false,
  })

  const fit = match.data ? jobFit(match.data.requirements) : null
  const toFix = score.data?.checks.filter((c) => c.score < 10).length ?? 0

  return (
    <div className='flex flex-col gap-3'>
      <div className='flex gap-2'>
        <Stat
          label='Writing'
          value={score.data ? `${score.data.overall}` : '…'}
          note={
            score.data
              ? toFix === 0
                ? 'every check passes'
                : `${toFix} to fix`
              : 'scoring…'
          }
          tone={score.data ? rate(score.data.overall / 100) : undefined}
        />
        <Stat
          label='Job fit'
          value={fit && fit.total > 0 ? `${fit.inCv}/${fit.total}` : '–'}
          note={
            !hasJobDescription
              ? 'no job description'
              : fit && fit.total > 0
                ? 'must-haves in experience'
                : match.isLoading
                  ? 'reading the job…'
                  : 'no must-haves listed'
          }
          tone={fit && fit.total > 0 ? rate(fit.inCv / fit.total) : undefined}
        />
      </div>

      <Tabs defaultValue='score'>
        <TabsList className='w-full'>
          <TabsTrigger value='score'>Writing score</TabsTrigger>
          <TabsTrigger value='match'>Job match</TabsTrigger>
        </TabsList>
        <TabsContent value='score'>
          <ScorePanel
            draftId={draftId}
            lastModified={lastModified}
            onShowLines={onShowLines}
            showSummary={false}
          />
        </TabsContent>
        <TabsContent value='match'>
          <JobMatchPanel
            draftId={draftId}
            lastModified={lastModified}
            hasJobDescription={hasJobDescription}
            candidateId={candidateId}
            onRefine={onRefine}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
