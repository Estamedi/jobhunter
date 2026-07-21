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
import { AnimatePresence, motion, MotionConfig } from 'framer-motion'
import { format } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { applicationsApi, type GetApplicationsResult, type JobApplication } from '../api'
import { STAGE_ACCENTS, UNKNOWN_STAGE_ACCENT } from '../data/constants'
import type { BoardStage } from '../hooks/use-board-stages'

// Standard column height so a column never resizes as cards move in/out — only the
// card list inside it scrolls once it overflows.
const COLUMN_HEIGHT = 'h-[34rem]'
const CARD_SPRING = { duration: 0.18, ease: 'easeOut' } as const

// Board view fetches without pagination; beyond this it silently truncates, which is
// acceptable for a personal pipeline tracker but would need real pagination at larger scale.
const BOARD_PAGE_SIZE = 500
const OTHER_STATUS = '__other__'
const OTHER_STAGE: BoardStage = { status: OTHER_STATUS, label: 'Other', badgeVariant: 'outline', visible: true }

function CardContent({ application }: { application: JobApplication }) {
  return (
    <>
      <p className='truncate text-sm font-semibold text-card-foreground'>{application.companyName || `#${application.companyId}`}</p>
      <p className='mt-0.5 truncate text-xs text-muted-foreground'>{application.jobRoleTitle || `#${application.jobRoleId}`}</p>
      <div className='mt-3 flex items-center justify-between'>
        <Badge
          variant={application.priority === 'High' ? 'destructive' : 'secondary'}
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

function BoardCard({ application, onView }: { application: JobApplication; onView: (id: number) => void }) {
  // The dragged card stays put (just dimmed) — DragOverlay renders the copy that follows
  // the pointer, so this element doesn't also chase the cursor.
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: application.id })

  return (
    <motion.div
      ref={setNodeRef}
      layout
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: isDragging ? 0.4 : 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.85 }}
      transition={CARD_SPRING}
      {...listeners}
      {...attributes}
      onClick={() => onView(application.id)}
      className='cursor-grab rounded-lg border bg-card p-3 shadow-sm transition-shadow hover:shadow-md active:cursor-grabbing'
    >
      <CardContent application={application} />
    </motion.div>
  )
}

function BoardColumn({
  stage,
  applications,
  accent,
  onView,
}: {
  stage: BoardStage
  applications: JobApplication[]
  accent: (typeof STAGE_ACCENTS)[number]
  onView: (id: number) => void
}) {
  const { isOver, setNodeRef } = useDroppable({ id: stage.status })

  return (
    <div className={`flex w-72 shrink-0 flex-col rounded-xl border bg-muted/20 ${COLUMN_HEIGHT}`}>
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
        className={`flex flex-1 flex-col gap-2 overflow-y-auto p-2.5 transition-colors duration-150 ${isOver ? `${accent.tint} ring-2 ring-inset ${accent.ring}` : ''}`}
      >
        {applications.length === 0 && (
          <div className='flex flex-1 items-center justify-center rounded-lg border border-dashed border-muted-foreground/25 text-center text-xs text-muted-foreground'>
            Drag applications here
          </div>
        )}
        <AnimatePresence initial={false}>
          {applications.map((app) => (
            <BoardCard key={app.id} application={app} onView={onView} />
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}

export function ApplicationsBoard({ stages, onView }: { stages: BoardStage[]; onView: (id: number) => void }) {
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
          <Skeleton key={i} className={`w-72 shrink-0 ${COLUMN_HEIGHT}`} />
        ))}
      </div>
    )
  }

  return (
    <MotionConfig reducedMotion='user'>
      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className='flex gap-4 overflow-x-auto pb-4'>
          {stages.map((stage, i) => (
            <BoardColumn
              key={stage.status}
              stage={stage}
              applications={grouped.get(stage.status) ?? []}
              accent={STAGE_ACCENTS[i % STAGE_ACCENTS.length]}
              onView={onView}
            />
          ))}
          {otherItems.length > 0 && (
            <BoardColumn stage={OTHER_STAGE} applications={otherItems} accent={UNKNOWN_STAGE_ACCENT} onView={onView} />
          )}
        </div>
        <DragOverlay dropAnimation={null}>
          {activeApp && (
            <div className='w-72 rotate-1 rounded-lg border bg-card p-3 shadow-lg'>
              <CardContent application={activeApp} />
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </MotionConfig>
  )
}
