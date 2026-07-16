import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { format } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { applicationsApi, type GetApplicationsResult, type JobApplication } from '../api'
import type { BoardStage } from '../hooks/use-board-stages'

// Board view fetches without pagination; beyond this it silently truncates, which is
// acceptable for a personal pipeline tracker but would need real pagination at larger scale.
const BOARD_PAGE_SIZE = 500
const OTHER_STATUS = '__other__'
const OTHER_STAGE: BoardStage = { status: OTHER_STATUS, label: 'Other', badgeVariant: 'outline', visible: true }

// Per-column accent, keyed by position rather than the user's badge-variant choice — a richer
// palette than the 4 badge variants gives each column a distinct identity at a glance.
const COLUMN_ACCENTS = [
  { top: 'border-t-violet-500', dot: 'bg-violet-500', tint: 'bg-violet-50 dark:bg-violet-500/10', ring: 'ring-violet-400/50' },
  { top: 'border-t-blue-500', dot: 'bg-blue-500', tint: 'bg-blue-50 dark:bg-blue-500/10', ring: 'ring-blue-400/50' },
  { top: 'border-t-emerald-500', dot: 'bg-emerald-500', tint: 'bg-emerald-50 dark:bg-emerald-500/10', ring: 'ring-emerald-400/50' },
  { top: 'border-t-amber-500', dot: 'bg-amber-500', tint: 'bg-amber-50 dark:bg-amber-500/10', ring: 'ring-amber-400/50' },
  { top: 'border-t-rose-500', dot: 'bg-rose-500', tint: 'bg-rose-50 dark:bg-rose-500/10', ring: 'ring-rose-400/50' },
  { top: 'border-t-cyan-500', dot: 'bg-cyan-500', tint: 'bg-cyan-50 dark:bg-cyan-500/10', ring: 'ring-cyan-400/50' },
  { top: 'border-t-orange-500', dot: 'bg-orange-500', tint: 'bg-orange-50 dark:bg-orange-500/10', ring: 'ring-orange-400/50' },
  { top: 'border-t-pink-500', dot: 'bg-pink-500', tint: 'bg-pink-50 dark:bg-pink-500/10', ring: 'ring-pink-400/50' },
]
const OTHER_ACCENT = { top: 'border-t-muted-foreground/30', dot: 'bg-muted-foreground/40', tint: 'bg-muted', ring: 'ring-muted-foreground/30' }

function CardContent({ application }: { application: JobApplication }) {
  return (
    <>
      <p className='truncate text-sm font-semibold text-card-foreground'>{application.companyName || `#${application.companyId}`}</p>
      <p className='mt-0.5 truncate text-xs text-muted-foreground'>{application.jobRoleTitle || `#${application.jobRoleId}`}</p>
      <div className='mt-3 flex items-center justify-between'>
        <Badge
          variant={application.priority === 'High' ? 'destructive' : application.priority === 'Medium' ? 'default' : 'secondary'}
          className='text-[10px]'
        >
          {application.priority}
        </Badge>
        {application.nextFollowUpDate && (
          <span className='text-[10px] text-muted-foreground'>{format(new Date(application.nextFollowUpDate), 'MMM d')}</span>
        )}
      </div>
    </>
  )
}

function BoardCard({ application }: { application: JobApplication }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: application.id })
  const style = transform ? { transform: CSS.Translate.toString(transform) } : undefined

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`cursor-grab rounded-lg border bg-card p-3 shadow-sm transition-shadow hover:shadow-md active:cursor-grabbing ${isDragging ? 'opacity-40' : ''}`}
    >
      <CardContent application={application} />
    </div>
  )
}

function BoardColumn({ stage, applications, accent }: { stage: BoardStage; applications: JobApplication[]; accent: (typeof COLUMN_ACCENTS)[number] }) {
  const { isOver, setNodeRef } = useDroppable({ id: stage.status })

  return (
    <div className='flex w-72 shrink-0 flex-col rounded-xl border bg-muted/20'>
      <div className={`flex items-center justify-between gap-2 rounded-t-xl border-t-4 px-3 py-2.5 ${accent.top}`}>
        <div className='flex min-w-0 items-center gap-2'>
          <span className={`h-2 w-2 shrink-0 rounded-full ${accent.dot}`} />
          <span className='truncate text-sm font-semibold'>{stage.label}</span>
        </div>
        <Badge variant='secondary' className='shrink-0 text-xs font-medium tabular-nums'>
          {applications.length}
        </Badge>
      </div>
      <div
        ref={setNodeRef}
        className={`flex min-h-[160px] flex-1 flex-col gap-2 p-2.5 transition-colors duration-150 ${isOver ? `${accent.tint} ring-2 ring-inset ${accent.ring}` : ''}`}
      >
        {applications.length === 0 && (
          <div className='flex flex-1 items-center justify-center rounded-lg border border-dashed border-muted-foreground/25 py-8 text-center text-xs text-muted-foreground'>
            Drag applications here
          </div>
        )}
        {applications.map((app) => (
          <BoardCard key={app.id} application={app} />
        ))}
      </div>
    </div>
  )
}

export function ApplicationsBoard({ stages }: { stages: BoardStage[] }) {
  const qc = useQueryClient()
  const [activeApp, setActiveApp] = useState<JobApplication | null>(null)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }))

  const { data, isLoading } = useQuery({
    queryKey: ['applications', 'board'],
    queryFn: () => applicationsApi.list({ pageSize: BOARD_PAGE_SIZE }),
  })

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => applicationsApi.updateStatus(id, status),
    onMutate: async ({ id, status }) => {
      await qc.cancelQueries({ queryKey: ['applications', 'board'] })
      const previous = qc.getQueryData<GetApplicationsResult>(['applications', 'board'])
      qc.setQueryData<GetApplicationsResult>(['applications', 'board'], (old) =>
        old ? { ...old, items: old.items.map((a) => (a.id === id ? { ...a, status } : a)) } : old
      )
      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) qc.setQueryData(['applications', 'board'], context.previous)
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['applications'] })
    },
  })

  const knownStatuses = useMemo(() => new Set(stages.map((s) => s.status)), [stages])

  const grouped = useMemo(() => {
    const map = new Map<string, JobApplication[]>()
    for (const stage of stages) map.set(stage.status, [])
    map.set(OTHER_STATUS, [])
    for (const app of data?.items ?? []) {
      const key = knownStatuses.has(app.status) ? app.status : OTHER_STATUS
      map.get(key)!.push(app)
    }
    return map
  }, [data, stages, knownStatuses])

  const otherItems = grouped.get(OTHER_STATUS) ?? []

  function handleDragStart(event: DragStartEvent) {
    const app = data?.items.find((a) => a.id === event.active.id)
    setActiveApp(app ?? null)
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveApp(null)
    const { active, over } = event
    if (!over) return
    const newStatus = String(over.id)
    const app = data?.items.find((a) => a.id === active.id)
    if (!app || app.status === newStatus || newStatus === OTHER_STATUS) return
    updateStatus.mutate({ id: app.id, status: newStatus })
  }

  if (isLoading) {
    return (
      <div className='flex gap-4 overflow-x-auto pb-4'>
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className='h-64 w-72 shrink-0' />
        ))}
      </div>
    )
  }

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className='flex gap-4 overflow-x-auto pb-4'>
        {stages.map((stage, i) => (
          <BoardColumn key={stage.status} stage={stage} applications={grouped.get(stage.status) ?? []} accent={COLUMN_ACCENTS[i % COLUMN_ACCENTS.length]} />
        ))}
        {otherItems.length > 0 && <BoardColumn stage={OTHER_STAGE} applications={otherItems} accent={OTHER_ACCENT} />}
      </div>
      <DragOverlay>
        {activeApp && (
          <div className='w-72 rotate-1 rounded-lg border bg-card p-3 shadow-lg'>
            <CardContent application={activeApp} />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}
