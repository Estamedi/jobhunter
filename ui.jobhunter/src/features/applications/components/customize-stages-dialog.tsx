import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ArrowDown, ArrowUp, Eye, EyeOff, Plus, RotateCcw, Trash2 } from 'lucide-react'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { applicationsApi } from '../api'
import { BADGE_VARIANTS, type BadgeVariant, type BoardStage } from '../hooks/use-board-stages'

const BOARD_QUERY_KEY = ['applications', 'board']

interface CustomizeStagesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  stages: BoardStage[]
  onRename: (status: string, label: string) => void
  onColor: (status: string, variant: BadgeVariant) => void
  onToggleVisibility: (status: string) => void
  onReorder: (status: string, direction: 'up' | 'down') => void
  onRemove: (status: string) => void
  onAdd: (label: string) => void
  onReset: () => void
}

export function CustomizeStagesDialog({
  open,
  onOpenChange,
  stages,
  onRename,
  onColor,
  onToggleVisibility,
  onReorder,
  onRemove,
  onAdd,
  onReset,
}: CustomizeStagesDialogProps) {
  const qc = useQueryClient()
  const [newLabel, setNewLabel] = useState('')
  const [reassignTarget, setReassignTarget] = useState<string | null>(null)
  const [reassignTo, setReassignTo] = useState('')

  const { data } = useQuery({
    queryKey: BOARD_QUERY_KEY,
    queryFn: () => applicationsApi.list({ pageSize: 500 }),
    enabled: open,
  })

  const countByStatus = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const app of data?.items ?? []) counts[app.status] = (counts[app.status] ?? 0) + 1
    return counts
  }, [data])

  const reassignAndRemove = useMutation({
    mutationFn: async ({ from, to }: { from: string; to: string }) => {
      const affected = (data?.items ?? []).filter((a) => a.status === from)
      await Promise.all(affected.map((a) => applicationsApi.updateStatus(a.id, to)))
    },
    onSuccess: (_data, { from }) => {
      onRemove(from)
      qc.invalidateQueries({ queryKey: ['applications'] })
      toast.success('Applications moved and stage removed')
      setReassignTarget(null)
      setReassignTo('')
    },
    onError: () => toast.error('Failed to move applications'),
  })

  function handleDeleteClick(status: string) {
    if ((countByStatus[status] ?? 0) === 0) {
      onRemove(status)
      return
    }
    setReassignTarget(status)
    setReassignTo(stages.find((s) => s.status !== status)?.status ?? '')
  }

  function handleConfirmReassign() {
    if (!reassignTarget || !reassignTo) return
    reassignAndRemove.mutate({ from: reassignTarget, to: reassignTo })
  }

  function handleAdd() {
    if (!newLabel.trim()) return
    onAdd(newLabel)
    setNewLabel('')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle>Customize board stages</DialogTitle>
        </DialogHeader>

        <div className='max-h-[400px] space-y-2 overflow-y-auto'>
          {stages.map((stage, i) => (
            <div key={stage.status} className='space-y-2 rounded-md border p-2'>
              <div className='flex items-center gap-2'>
                <div className='flex flex-col'>
                  <button
                    type='button'
                    className='text-muted-foreground disabled:opacity-30'
                    disabled={i === 0}
                    onClick={() => onReorder(stage.status, 'up')}
                  >
                    <ArrowUp className='h-3.5 w-3.5' />
                  </button>
                  <button
                    type='button'
                    className='text-muted-foreground disabled:opacity-30'
                    disabled={i === stages.length - 1}
                    onClick={() => onReorder(stage.status, 'down')}
                  >
                    <ArrowDown className='h-3.5 w-3.5' />
                  </button>
                </div>

                <Input value={stage.label} onChange={(e) => onRename(stage.status, e.target.value)} className='h-8 flex-1' />

                <div className='flex gap-1'>
                  {BADGE_VARIANTS.map((variant) => (
                    <button
                      key={variant}
                      type='button'
                      title={variant}
                      onClick={() => onColor(stage.status, variant)}
                      className={`rounded-full ring-offset-1 ${stage.badgeVariant === variant ? 'ring-2 ring-ring' : ''}`}
                    >
                      <Badge variant={variant} className='h-4 w-4 rounded-full p-0' />
                    </button>
                  ))}
                </div>

                <Button variant='ghost' size='icon' className='h-8 w-8' onClick={() => onToggleVisibility(stage.status)} title={stage.visible ? 'Hide from board' : 'Show on board'}>
                  {stage.visible ? <Eye className='h-4 w-4' /> : <EyeOff className='h-4 w-4 text-muted-foreground' />}
                </Button>

                <Button variant='ghost' size='icon' className='h-8 w-8 text-destructive' onClick={() => handleDeleteClick(stage.status)} title='Delete stage'>
                  <Trash2 className='h-4 w-4' />
                </Button>
              </div>

              {reassignTarget === stage.status && (
                <div className='flex items-center gap-2 rounded-md bg-muted/50 p-2 text-sm'>
                  <span className='text-muted-foreground'>
                    Move {countByStatus[stage.status] ?? 0} application(s) to
                  </span>
                  <select
                    value={reassignTo}
                    onChange={(e) => setReassignTo(e.target.value)}
                    className='flex h-8 rounded-md border border-input bg-transparent px-2 text-sm'
                  >
                    {stages.filter((s) => s.status !== stage.status).map((s) => (
                      <option key={s.status} value={s.status}>{s.label}</option>
                    ))}
                  </select>
                  <Button size='sm' onClick={handleConfirmReassign} disabled={reassignAndRemove.isPending}>
                    Move & delete
                  </Button>
                  <Button size='sm' variant='ghost' onClick={() => setReassignTarget(null)}>
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className='flex items-center gap-2 pt-2'>
          <Input
            placeholder='New stage name...'
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAdd() } }}
            className='h-8 flex-1'
          />
          <Button size='sm' variant='outline' onClick={handleAdd}>
            <Plus className='mr-1 h-4 w-4' /> Add stage
          </Button>
        </div>

        <DialogFooter className='sm:justify-between'>
          <Button variant='ghost' size='sm' onClick={onReset}>
            <RotateCcw className='mr-1 h-4 w-4' /> Reset to default
          </Button>
          <Button onClick={() => onOpenChange(false)}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
