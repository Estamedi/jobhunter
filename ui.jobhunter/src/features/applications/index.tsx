import { Fragment, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { useQuery, useQueries, useMutation, useQueryClient } from '@tanstack/react-query'
import { applicationsApi, type JobApplication, type CreateApplicationDto } from './api'
import { candidatesApi } from '@/features/candidates/api'
import { ListPagination } from '@/components/list-pagination'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import { Plus, MoreHorizontal, Trash2, Pencil, Download, FileText, Settings2, LayoutGrid, List, Eye, Sparkles } from 'lucide-react'
import { format, startOfWeek, subWeeks } from 'date-fns'
import { ApplicationDetailDialog } from './components/application-detail-dialog'
import { ApplicationsMutateDialog } from './components/applications-mutate-dialog'
import { ExtensionBanner } from './components/extension-banner'
import { ApplicationsBoard } from './components/applications-board'
import { ApplicationsFilterBar } from './components/applications-filter-bar'
import { CustomizeStagesDialog } from './components/customize-stages-dialog'
import { FOLLOWUP_COLORS, formatStatusLabel } from './data/constants'
import { DEFAULT_FILTERS, toApiFilters, type ApplicationFilters } from './data/filters'
import { useBoardStages } from './hooks/use-board-stages'
import { downloadCvFile } from '@/features/cvs/lib/cv-file'

const PAGE_SIZE = 50

const NEEDS_ACTION = [
  { value: 'Overdue', label: 'Overdue follow-ups' },
  { value: 'DueToday', label: 'Due today' },
  { value: 'ThisWeek', label: 'Due this week' },
]

// Rows arrive newest first, so grouping by week only needs to label where each group starts.
function weekGroup(a: JobApplication): string {
  const raw = a.appliedDate ?? a.lastActivityDate
  if (!raw) return 'Earlier'
  const d = new Date(raw)
  const thisWeek = startOfWeek(new Date(), { weekStartsOn: 1 })
  if (d >= thisWeek) return 'This week'
  if (d >= subWeeks(thisWeek, 1)) return 'Last week'
  return 'Earlier'
}

export function Applications() {
  const qc = useQueryClient()
  const [filters, setFilters] = useState<ApplicationFilters>(DEFAULT_FILTERS)
  const [page, setPage] = useState(1)
  const [showRejected, setShowRejected] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<JobApplication | null>(null)
  const [customizeOpen, setCustomizeOpen] = useState(false)
  const [viewingApplicationId, setViewingApplicationId] = useState<number | null>(null)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)

  function openApplication(id: number) {
    setViewingApplicationId(id)
    setViewDialogOpen(true)
  }

  const {
    stages,
    visibleStages,
    addStage,
    renameStage,
    setStageColor,
    toggleVisibility,
    reorderStage,
    removeStage,
    resetToDefault,
  } = useBoardStages()
  const stageByStatus = Object.fromEntries(stages.map((s) => [s.status, s]))

  function updateFilters(patch: Partial<ApplicationFilters>) {
    setFilters((prev) => ({ ...prev, ...patch }))
    setPage(1)
  }

  // Rejected applications pile up fastest, so the list hides them until asked for.
  const excludeStatus = !filters.status && !showRejected ? 'Rejected' : undefined

  const { data, isLoading } = useQuery({
    queryKey: ['applications', filters, excludeStatus, page],
    queryFn: () => applicationsApi.list({ ...toApiFilters(filters), excludeStatus, page, pageSize: PAGE_SIZE }),
  })

  // One tiny query per stage just to read its total for the count chips.
  const stageCounts = useQueries({
    queries: stages.map((s) => ({
      queryKey: ['applications', 'count', s.status, { ...filters, status: undefined }],
      queryFn: () => applicationsApi.list({ ...toApiFilters({ ...filters, status: s.status }), page: 1, pageSize: 1 }),
      select: (r: { total: number }) => r.total,
    })),
  })

  const changeStatus = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => applicationsApi.updateStatus(id, status),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['applications'] }); toast.success('Status updated') },
  })

  function showView(view: 'active' | 'all' | string) {
    setShowRejected(view === 'all')
    updateFilters({ status: view === 'active' || view === 'all' ? undefined : view })
  }

  const { data: myCandidate } = useQuery({
    queryKey: ['candidates', 'me'],
    queryFn: () => candidatesApi.mine(),
  })
  const candidateId = myCandidate?.items[0]?.id

  const create = useMutation({
    mutationFn: applicationsApi.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['applications'] }); toast.success('Application created'); setDialogOpen(false) },
  })

  const update = useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: Partial<CreateApplicationDto> }) => applicationsApi.update(id, dto),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['applications'] }); toast.success('Application updated'); setDialogOpen(false) },
  })

  const remove = useMutation({
    mutationFn: applicationsApi.delete,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['applications'] }); toast.success('Application deleted') },
  })

  function handleSubmit(dto: CreateApplicationDto) {
    if (editing) update.mutate({ id: editing.id, dto })
    else create.mutate(dto)
  }

  const isBusy = create.isPending || update.isPending

  return (
    <div className='space-y-4'>
      <ExtensionBanner />
      <Tabs defaultValue='all'>
        <div className='flex flex-wrap items-center justify-between gap-2'>
          <TabsList>
            <TabsTrigger value='all'>
              <List className='h-4 w-4 mr-1' /> List View
            </TabsTrigger>
            <TabsTrigger value='board'>
              <LayoutGrid className='h-4 w-4 mr-1' /> Kanban View
            </TabsTrigger>
          </TabsList>
          <Button onClick={() => { setEditing(null); setDialogOpen(true) }}>
            <Plus className='h-4 w-4 mr-1' /> Add Application
          </Button>
        </div>

        <div className='flex flex-wrap items-center gap-2' role='group' aria-label='Quick filters'>
          <Button size='sm' variant={!filters.status && !showRejected ? 'default' : 'outline'} onClick={() => showView('active')}>
            Active
          </Button>
          {stages.map((st, i) => (
            <Button
              key={st.status}
              size='sm'
              variant={filters.status === st.status ? 'default' : 'outline'}
              onClick={() => showView(st.status)}
            >
              {st.label}
              <span className='ml-1.5 tabular-nums text-xs opacity-70'>{stageCounts[i]?.data ?? '–'}</span>
            </Button>
          ))}
          <Button size='sm' variant={!filters.status && showRejected ? 'default' : 'outline'} onClick={() => showView('all')}>
            All
          </Button>
          <span className='mx-1 h-5 w-px bg-border' aria-hidden />
          {NEEDS_ACTION.map((n) => (
            <Button
              key={n.value}
              size='sm'
              variant={filters.followUpStatus === n.value ? 'secondary' : 'ghost'}
              aria-pressed={filters.followUpStatus === n.value}
              onClick={() => updateFilters({ followUpStatus: filters.followUpStatus === n.value ? undefined : n.value })}
            >
              {n.label}
            </Button>
          ))}
        </div>

        <ApplicationsFilterBar filters={filters} onChange={updateFilters} statusOptions={stages} />

        <TabsContent value='board' className='mt-4 space-y-3'>
          <div className='flex justify-end'>
            <Button variant='outline' size='sm' onClick={() => setCustomizeOpen(true)}>
              <Settings2 className='h-4 w-4 mr-1' /> Customize board
            </Button>
          </div>
          <ApplicationsBoard stages={visibleStages} onView={openApplication} filters={filters} />
        </TabsContent>

        <TabsContent value='all' className='mt-4 space-y-4'>
      <div className='rounded-md border overflow-x-auto'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Candidate</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Vacancy</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Applied</TableHead>
              <TableHead>Follow-Up</TableHead>
              <TableHead>Resume</TableHead>
              <TableHead className='w-10' />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && <TableRow><TableCell colSpan={10}><Skeleton className='h-8 w-full' /></TableCell></TableRow>}
            {!isLoading && data?.items.length === 0 && (
              <TableRow><TableCell colSpan={10} className='text-center text-muted-foreground py-8'>No applications found.</TableCell></TableRow>
            )}
            {data?.items.map((a, idx) => (
              <Fragment key={a.id}>
              {(idx === 0 || weekGroup(data.items[idx - 1]) !== weekGroup(a)) && (
                <TableRow className='bg-muted/40 hover:bg-muted/40'>
                  <TableCell colSpan={10} className='py-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground'>
                    {weekGroup(a)}
                  </TableCell>
                </TableRow>
              )}
              <TableRow
                className='cursor-pointer'
                onClick={() => openApplication(a.id)}
              >
                <TableCell className='font-medium text-sm'>{a.candidateName || `#${a.candidateId}`}</TableCell>
                <TableCell className='text-sm'>{a.companyName || `#${a.companyId}`}</TableCell>
                <TableCell className='text-sm max-w-[150px] truncate'>{a.jobRoleTitle || `#${a.jobRoleId}`}</TableCell>
                <TableCell
                  className='text-sm text-muted-foreground max-w-[200px] truncate'
                  title={a.jobRoleDescription || undefined}
                >
                  {a.jobRoleDescription || '—'}
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Select value={a.status} onValueChange={(status) => changeStatus.mutate({ id: a.id, status })}>
                    <SelectTrigger className='h-8 w-[130px] text-xs' aria-label={`Status for ${a.jobRoleTitle ?? 'application'}`}>
                      <SelectValue>{stageByStatus[a.status]?.label ?? formatStatusLabel(a.status)}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {stages.map((st) => <SelectItem key={st.status} value={st.status}>{st.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Badge variant={a.priority === 'High' ? 'destructive' : 'secondary'} className='text-xs'>
                    {a.priority}
                  </Badge>
                </TableCell>
                <TableCell className='text-sm text-muted-foreground'>
                  {a.appliedDate ? format(new Date(a.appliedDate), 'MMM d, yyyy') : '—'}
                </TableCell>
                <TableCell>
                  {a.nextFollowUpDate ? (
                    <span className={`text-sm ${FOLLOWUP_COLORS[a.followUpStatus ?? ''] ?? 'text-muted-foreground'}`}>
                      {format(new Date(a.nextFollowUpDate), 'MMM d')}
                      {a.followUpStatus && a.followUpStatus !== 'NotNeeded' && (
                        <span className='ml-1 text-xs'>({a.followUpStatus})</span>
                      )}
                    </span>
                  ) : '—'}
                </TableCell>
                <TableCell>
                  {a.cvId && a.cvFileName ? (
                    <Button
                      variant='ghost'
                      size='sm'
                      className='h-8 max-w-[140px] justify-start gap-1 px-2 text-sm'
                      title={a.cvFileName}
                      onClick={(e) => { e.stopPropagation(); downloadCvFile({ id: a.cvId!, fileName: a.cvFileName! }) }}
                    >
                      <FileText className='h-4 w-4 shrink-0 text-muted-foreground' />
                      <span className='truncate'>{a.cvFileName}</span>
                      <Download className='h-3 w-3 shrink-0 text-muted-foreground' />
                    </Button>
                  ) : (
                    <span className='text-sm text-muted-foreground'>—</span>
                  )}
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant='ghost' size='icon' className='h-8 w-8'><MoreHorizontal className='h-4 w-4' /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align='end'>
                      <DropdownMenuItem onClick={() => openApplication(a.id)}>
                        <Eye className='h-4 w-4 mr-2' /> View details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => { setEditing(a); setDialogOpen(true) }}><Pencil className='h-4 w-4 mr-2' /> Edit</DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to='/cv-builder' search={{ applicationId: a.id }}><Sparkles className='h-4 w-4 mr-2' /> Tailor CV</Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className='text-destructive' onClick={() => remove.mutate(a.id)}><Trash2 className='h-4 w-4 mr-2' /> Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
              </Fragment>
            ))}
          </TableBody>
        </Table>
      </div>

      {!isLoading && (
        <ListPagination page={page} pageSize={PAGE_SIZE} total={data?.total ?? 0} onPageChange={setPage} itemLabel='application' />
      )}
        </TabsContent>
      </Tabs>

      <CustomizeStagesDialog
        open={customizeOpen}
        onOpenChange={setCustomizeOpen}
        stages={stages}
        onRename={renameStage}
        onColor={setStageColor}
        onToggleVisibility={toggleVisibility}
        onReorder={reorderStage}
        onRemove={removeStage}
        onAdd={addStage}
        onReset={resetToDefault}
      />

      <ApplicationsMutateDialog
        key={editing?.id ?? 'create'}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        currentRow={editing}
        candidateId={candidateId}
        isPending={isBusy}
        onSubmit={handleSubmit}
      />

      <ApplicationDetailDialog
        applicationId={viewingApplicationId}
        open={viewDialogOpen}
        onOpenChange={setViewDialogOpen}
      />
    </div>
  )
}
