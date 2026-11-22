import * as React from 'react'
import { useState } from 'react'
import { format } from 'date-fns'
import { Calendar as CalendarIcon, Search, SlidersHorizontal, X } from 'lucide-react'
import { PlusCircledIcon } from '@radix-ui/react-icons'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DatePicker } from '@/components/date-picker'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'
import { MultiSelectFilter } from '@/components/filters/multi-select-filter'
import { EMPLOYMENT_TYPES, PRIORITIES, WORK_TYPES } from '../data/constants'
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
        <Button variant='outline' size='sm' className='h-9 border-dashed justify-start'>
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
        <Button variant='outline' size='sm' className='h-9 border-dashed justify-start'>
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

const CLEARED: Partial<ApplicationFilters> = {
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
}

// Filters that live in the "Filters" sheet. Search and the status / follow-up chips are always visible.
function advancedChips(f: ApplicationFilters, onChange: (patch: Partial<ApplicationFilters>) => void) {
  const chips: { key: string; label: string; clear: () => void }[] = []
  f.priority.forEach((v) => chips.push({ key: `p-${v}`, label: `Priority: ${v}`, clear: () => onChange({ priority: f.priority.filter((x) => x !== v) }) }))
  f.workType.forEach((v) => chips.push({ key: `w-${v}`, label: v, clear: () => onChange({ workType: f.workType.filter((x) => x !== v) }) }))
  f.employmentType.forEach((v) => chips.push({ key: `e-${v}`, label: v, clear: () => onChange({ employmentType: f.employmentType.filter((x) => x !== v) }) }))
  if (f.country) chips.push({ key: 'country', label: `Country: ${f.country}`, clear: () => onChange({ country: '' }) })
  if (f.jobTitle) chips.push({ key: 'title', label: `Title: ${f.jobTitle}`, clear: () => onChange({ jobTitle: '' }) })
  if (f.salaryMin !== undefined || f.salaryMax !== undefined)
    chips.push({ key: 'salary', label: `Salary: ${f.salaryMin ?? '…'} – ${f.salaryMax ?? '…'}`, clear: () => onChange({ salaryMin: undefined, salaryMax: undefined }) })
  if (f.appliedFrom || f.appliedTo)
    chips.push({ key: 'applied', label: `Applied: ${f.appliedFrom ? format(f.appliedFrom, 'MMM d') : '…'} – ${f.appliedTo ? format(f.appliedTo, 'MMM d') : '…'}`, clear: () => onChange({ appliedFrom: undefined, appliedTo: undefined }) })
  if (f.followUpFrom || f.followUpTo)
    chips.push({ key: 'followup', label: `Follow-up: ${f.followUpFrom ? format(f.followUpFrom, 'MMM d') : '…'} – ${f.followUpTo ? format(f.followUpTo, 'MMM d') : '…'}`, clear: () => onChange({ followUpFrom: undefined, followUpTo: undefined }) })
  return chips
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className='space-y-2'>
      <h3 className='text-xs font-semibold uppercase tracking-wide text-muted-foreground'>{title}</h3>
      <div className='flex flex-col items-start gap-2'>{children}</div>
    </section>
  )
}

export function ApplicationsFilterBar({
  filters,
  onChange,
}: {
  filters: ApplicationFilters
  onChange: (patch: Partial<ApplicationFilters>) => void
}) {
  const [resetSignal, setResetSignal] = useState(0)
  const chips = advancedChips(filters, onChange)

  function clearAll() {
    setResetSignal((s) => s + 1)
    onChange(CLEARED)
  }
  function clearAdvanced() {
    setResetSignal((s) => s + 1)
    const { search: _s, status: _st, followUpStatus: _fs, ...advanced } = CLEARED
    onChange(advanced)
  }

  return (
    <div className='space-y-2'>
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

        <Sheet>
          <SheetTrigger asChild>
            <Button variant='outline' size='sm' className='h-9 font-medium'>
              <SlidersHorizontal className='h-4 w-4 mr-1' />
              Filters
              {chips.length > 0 && (
                <span className='ml-1 min-w-5 rounded-full bg-primary px-1.5 text-center text-xs font-semibold tabular-nums text-primary-foreground'>
                  {chips.length}
                </span>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent className='flex w-full flex-col gap-0 sm:max-w-md'>
            <SheetHeader>
              <SheetTitle>Filters</SheetTitle>
              <SheetDescription>Results update as you change them.</SheetDescription>
            </SheetHeader>
            <div className='flex-1 space-y-6 overflow-y-auto px-4 pb-4'>
              <Section title='Role'>
                <DebouncedInput
                  placeholder='Job title'
                  value={filters.jobTitle}
                  resetSignal={resetSignal}
                  onDebouncedChange={(jobTitle) => onChange({ jobTitle })}
                />
                <DebouncedInput
                  placeholder='Country'
                  value={filters.country}
                  resetSignal={resetSignal}
                  onDebouncedChange={(country) => onChange({ country })}
                />
                <MultiSelectFilter title='Work type' options={WORK_TYPE_OPTIONS} value={filters.workType} onChange={(workType) => onChange({ workType })} />
                <MultiSelectFilter title='Employment type' options={EMPLOYMENT_TYPE_OPTIONS} value={filters.employmentType} onChange={(employmentType) => onChange({ employmentType })} />
                <SalaryRangeFilter
                  min={filters.salaryMin}
                  max={filters.salaryMax}
                  resetSignal={resetSignal}
                  onChange={({ min, max }) => onChange({ salaryMin: min, salaryMax: max })}
                />
              </Section>
              <Section title='Priority'>
                <MultiSelectFilter title='Priority' options={PRIORITY_OPTIONS} value={filters.priority} onChange={(priority) => onChange({ priority })} />
              </Section>
              <Section title='Dates'>
                <DateRangeFilter label='Applied' from={filters.appliedFrom} to={filters.appliedTo} onChange={({ from, to }) => onChange({ appliedFrom: from, appliedTo: to })} />
                <DateRangeFilter label='Follow-up' from={filters.followUpFrom} to={filters.followUpTo} onChange={({ from, to }) => onChange({ followUpFrom: from, followUpTo: to })} />
              </Section>
            </div>
            <SheetFooter className='border-t'>
              <Button variant='outline' disabled={chips.length === 0} onClick={clearAdvanced}>
                Clear filters
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>

        {hasActiveFilters(filters) && (
          <Button variant='ghost' size='sm' onClick={clearAll}>
            <X className='h-4 w-4 mr-1' /> Reset all
          </Button>
        )}
      </div>

      {chips.length > 0 && (
        <div className='flex flex-wrap items-center gap-2' aria-label='Active filters'>
          {chips.map((c) => (
            <Badge key={c.key} variant='secondary' className='gap-1 rounded-full py-1 pl-2.5 pr-1 text-xs font-medium'>
              {c.label}
              <button
                type='button'
                aria-label={`Remove filter ${c.label}`}
                onClick={c.clear}
                className='rounded-full p-0.5 hover:bg-foreground/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
              >
                <X className='h-3 w-3' />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}
