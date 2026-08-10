import * as React from 'react'
import { useState } from 'react'
import { format } from 'date-fns'
import { Calendar as CalendarIcon, Search, X } from 'lucide-react'
import { PlusCircledIcon } from '@radix-ui/react-icons'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DatePicker } from '@/components/date-picker'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'
import { MultiSelectFilter } from '@/components/filters/multi-select-filter'
import { EMPLOYMENT_TYPES, FOLLOW_UP_STATUSES, PRIORITIES, WORK_TYPES } from '../data/constants'
import { hasActiveFilters, type ApplicationFilters } from '../data/filters'

type DebouncedInputProps = {
  value: string
  onDebouncedChange: (value: string) => void
  delay?: number
  // Bumped by the parent on "Clear filters". A plain `value` comparison can't detect a reset
  // that happens to land on the same text the field already shows locally — e.g. Clear sets
  // country back to '' while a still-pending debounce for a just-typed 'Germany' hasn't reached
  // the parent yet, so the incoming prop is '' both before and after. This signal is independent
  // of the text itself, so it can't miss that case.
  resetSignal: number
} & Omit<React.ComponentProps<typeof Input>, 'value' | 'onChange'>

function DebouncedInput({ value, onDebouncedChange, delay = 400, resetSignal, ...props }: DebouncedInputProps) {
  const [local, setLocal] = useState(value)
  const [prevValue, setPrevValue] = useState(value)
  const [prevResetSignal, setPrevResetSignal] = useState(resetSignal)
  const [timeoutId, setTimeoutId] = useState<ReturnType<typeof setTimeout> | null>(null)

  // Cancelling here (during the render triggered by the prop/signal change, not in an effect)
  // happens synchronously, before the browser's timer could ever fire and overwrite it.
  if (value !== prevValue || resetSignal !== prevResetSignal) {
    setPrevValue(value)
    setPrevResetSignal(resetSignal)
    setLocal(value)
    if (timeoutId) {
      clearTimeout(timeoutId)
      setTimeoutId(null)
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const next = e.target.value
    setLocal(next)
    if (timeoutId) clearTimeout(timeoutId)
    setTimeoutId(setTimeout(() => onDebouncedChange(next), delay))
  }

  return <Input {...props} value={local} onChange={handleChange} />
}

function DateRangeFilter({
  label,
  from,
  to,
  onChange,
}: {
  label: string
  from?: Date
  to?: Date
  onChange: (range: { from?: Date; to?: Date }) => void
}) {
  const active = Boolean(from || to)
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant='outline' size='sm' className='h-9 border-dashed'>
          <CalendarIcon className='h-4 w-4' />
          {label}
          {active && (
            <>
              <Separator orientation='vertical' className='mx-2 h-4' />
              <Badge variant='secondary' className='rounded-sm px-1 font-normal'>
                {from ? format(from, 'MMM d') : '…'} – {to ? format(to, 'MMM d') : '…'}
              </Badge>
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-auto p-3' align='start'>
        <div className='flex flex-col gap-3'>
          <div>
            <p className='mb-1 text-xs text-muted-foreground'>From</p>
            <DatePicker selected={from} onSelect={(date) => onChange({ from: date, to })} />
          </div>
          <div>
            <p className='mb-1 text-xs text-muted-foreground'>To</p>
            <DatePicker selected={to} onSelect={(date) => onChange({ from, to: date })} />
          </div>
          {active && (
            <Button variant='ghost' size='sm' onClick={() => onChange({ from: undefined, to: undefined })}>
              Clear
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

function SalaryRangeFilter({
  min,
  max,
  onChange,
  resetSignal,
}: {
  min?: number
  max?: number
  onChange: (range: { min?: number; max?: number }) => void
  resetSignal: number
}) {
  const active = min !== undefined || max !== undefined
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant='outline' size='sm' className='h-9 border-dashed'>
          <PlusCircledIcon className='size-4' />
          Salary
          {active && (
            <>
              <Separator orientation='vertical' className='mx-2 h-4' />
              <Badge variant='secondary' className='rounded-sm px-1 font-normal'>
                {min ?? '…'} – {max ?? '…'}
              </Badge>
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-56 p-3' align='start'>
        <div className='flex flex-col gap-2'>
          <DebouncedInput
            type='number'
            placeholder='Min'
            value={min?.toString() ?? ''}
            resetSignal={resetSignal}
            onDebouncedChange={(v) => onChange({ min: Number.isFinite(Number(v)) && v !== '' ? Number(v) : undefined, max })}
          />
          <DebouncedInput
            type='number'
            placeholder='Max'
            value={max?.toString() ?? ''}
            resetSignal={resetSignal}
            onDebouncedChange={(v) => onChange({ min, max: Number.isFinite(Number(v)) && v !== '' ? Number(v) : undefined })}
          />
          {active && (
            <Button variant='ghost' size='sm' onClick={() => onChange({ min: undefined, max: undefined })}>
              Clear
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

const WORK_TYPE_OPTIONS = WORK_TYPES.map((w) => ({ label: w, value: w }))
const EMPLOYMENT_TYPE_OPTIONS = EMPLOYMENT_TYPES.map((e) => ({ label: e, value: e }))
const PRIORITY_OPTIONS = PRIORITIES.map((p) => ({ label: p, value: p }))

export function ApplicationsFilterBar({
  filters,
  onChange,
  statusOptions,
}: {
  filters: ApplicationFilters
  onChange: (patch: Partial<ApplicationFilters>) => void
  statusOptions: { status: string; label: string }[]
}) {
  const [resetSignal, setResetSignal] = useState(0)

  return (
    <div className='flex flex-wrap items-center gap-2'>
      <div className='relative flex-1 min-w-[200px] max-w-sm'>
        <Search className='absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground' />
        <DebouncedInput
          placeholder='Search applications...'
          className='pl-8'
          value={filters.search}
          resetSignal={resetSignal}
          onDebouncedChange={(search) => onChange({ search })}
        />
      </div>

      <select
        value={filters.status ?? ''}
        onChange={(e) => onChange({ status: e.target.value || undefined })}
        className='flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm'
      >
        <option value=''>All statuses</option>
        {statusOptions.map((s) => (
          <option key={s.status} value={s.status}>{s.label}</option>
        ))}
      </select>

      <MultiSelectFilter
        title='Priority'
        options={PRIORITY_OPTIONS}
        value={filters.priority}
        onChange={(priority) => onChange({ priority })}
      />

      <MultiSelectFilter
        title='Work type'
        options={WORK_TYPE_OPTIONS}
        value={filters.workType}
        onChange={(workType) => onChange({ workType })}
      />

      <MultiSelectFilter
        title='Employment type'
        options={EMPLOYMENT_TYPE_OPTIONS}
        value={filters.employmentType}
        onChange={(employmentType) => onChange({ employmentType })}
      />

      <DebouncedInput
        placeholder='Country'
        className='h-9 w-36'
        value={filters.country}
        resetSignal={resetSignal}
        onDebouncedChange={(country) => onChange({ country })}
      />

      <DebouncedInput
        placeholder='Job title'
        className='h-9 w-40'
        value={filters.jobTitle}
        resetSignal={resetSignal}
        onDebouncedChange={(jobTitle) => onChange({ jobTitle })}
      />

      <SalaryRangeFilter
        min={filters.salaryMin}
        max={filters.salaryMax}
        resetSignal={resetSignal}
        onChange={({ min, max }) => onChange({ salaryMin: min, salaryMax: max })}
      />

      <DateRangeFilter
        label='Applied'
        from={filters.appliedFrom}
        to={filters.appliedTo}
        onChange={({ from, to }) => onChange({ appliedFrom: from, appliedTo: to })}
      />

      <DateRangeFilter
        label='Follow-up'
        from={filters.followUpFrom}
        to={filters.followUpTo}
        onChange={({ from, to }) => onChange({ followUpFrom: from, followUpTo: to })}
      />

      <select
        value={filters.followUpStatus ?? ''}
        onChange={(e) => onChange({ followUpStatus: e.target.value || undefined })}
        className='flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm'
      >
        <option value=''>Any follow-up status</option>
        {FOLLOW_UP_STATUSES.map((s) => (
          <option key={s.value} value={s.value}>{s.label}</option>
        ))}
      </select>

      {hasActiveFilters(filters) && (
        <Button
          variant='ghost'
          size='sm'
          onClick={() => {
            setResetSignal((s) => s + 1)
            onChange({
              search: '',
              status: undefined,
              priority: [],
              workType: [],
              employmentType: [],
              country: '',
              jobTitle: '',
              salaryMin: undefined,
              salaryMax: undefined,
              appliedFrom: undefined,
              appliedTo: undefined,
              followUpFrom: undefined,
              followUpTo: undefined,
              followUpStatus: undefined,
            })
          }}
        >
          <X className='h-4 w-4 mr-1' /> Clear filters
        </Button>
      )}
    </div>
  )
}
