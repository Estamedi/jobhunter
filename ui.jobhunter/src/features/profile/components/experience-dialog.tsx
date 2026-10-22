import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  type EmploymentType,
  type ProfileExperience,
  type SaveExperienceDto,
  type WorkplaceType,
} from '../api'
import {
  EMPLOYMENT_TYPES,
  MONTHS,
  WORKPLACE_TYPES,
  parseYearMonth,
  toDateString,
} from '../lib/experience'

const DESCRIPTION_MAX = 2000
const NONE = '__none__'
const THIS_YEAR = new Date().getFullYear()
const YEARS = Array.from({ length: 60 }, (_, i) => THIS_YEAR + 1 - i)

function MonthYear({
  label,
  required,
  month,
  year,
  onChange,
}: {
  label: string
  required?: boolean
  month: number | null
  year: number | null
  onChange: (month: number | null, year: number | null) => void
}) {
  return (
    <div className='space-y-1'>
      <Label>
        {label}
        {required && '*'}
      </Label>
      <div className='grid grid-cols-2 gap-3'>
        <Select
          value={month ? String(month) : ''}
          onValueChange={(v) => onChange(Number(v), year)}
        >
          <SelectTrigger className='w-full'>
            <SelectValue placeholder='Month' />
          </SelectTrigger>
          <SelectContent>
            {MONTHS.map((m, i) => (
              <SelectItem key={m} value={String(i + 1)}>
                {m}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={year ? String(year) : ''}
          onValueChange={(v) => onChange(month, Number(v))}
        >
          <SelectTrigger className='w-full'>
            <SelectValue placeholder='Year' />
          </SelectTrigger>
          <SelectContent>
            {YEARS.map((y) => (
              <SelectItem key={y} value={String(y)}>
                {y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

export function ExperienceDialog({
  open,
  experience,
  isSaving,
  isDeleting,
  onOpenChange,
  onSave,
  onDelete,
}: {
  open: boolean
  experience: ProfileExperience | null
  isSaving: boolean
  isDeleting: boolean
  onOpenChange: (open: boolean) => void
  onSave: (dto: SaveExperienceDto) => void
  onDelete: () => void
}) {
  const start = parseYearMonth(experience?.startDate)
  const end = parseYearMonth(experience?.endDate)

  const [title, setTitle] = useState(experience?.title ?? '')
  const [employmentType, setEmploymentType] = useState<EmploymentType | null>(
    experience?.employmentType ?? null
  )
  const [company, setCompany] = useState(experience?.company ?? '')
  const [isCurrent, setIsCurrent] = useState(experience?.isCurrent ?? false)
  const [startMonth, setStartMonth] = useState<number | null>(
    start?.month ?? null
  )
  const [startYear, setStartYear] = useState<number | null>(start?.year ?? null)
  const [endMonth, setEndMonth] = useState<number | null>(end?.month ?? null)
  const [endYear, setEndYear] = useState<number | null>(end?.year ?? null)
  const [location, setLocation] = useState(experience?.location ?? '')
  const [workplaceType, setWorkplaceType] = useState<WorkplaceType | null>(
    experience?.workplaceType ?? null
  )
  const [description, setDescription] = useState(experience?.description ?? '')
  const [skills, setSkills] = useState<string[]>(experience?.skills ?? [])
  const [skillInput, setSkillInput] = useState('')

  const addSkill = () => {
    const value = skillInput.trim()
    if (value && !skills.some((s) => s.toLowerCase() === value.toLowerCase())) {
      setSkills([...skills, value])
    }
    setSkillInput('')
  }

  const startOk = !!startMonth && !!startYear
  const endOk = isCurrent || (!!endMonth && !!endYear)
  const endBeforeStart =
    !isCurrent &&
    startOk &&
    !!endMonth &&
    !!endYear &&
    endYear * 12 + endMonth < startYear * 12 + startMonth
  const canSave =
    !!title.trim() && !!company.trim() && startOk && endOk && !endBeforeStart

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-h-[90vh] max-w-xl overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>
            {experience ? 'Edit experience' : 'Add experience'}
          </DialogTitle>
        </DialogHeader>

        <form
          id='experience-form'
          className='space-y-4'
          onSubmit={(e) => {
            e.preventDefault()
            if (!canSave) return
            onSave({
              title: title.trim(),
              employmentType,
              company: company.trim(),
              isCurrent,
              startDate: toDateString(startYear!, startMonth!),
              endDate: isCurrent ? null : toDateString(endYear!, endMonth!),
              location: location.trim() || null,
              workplaceType,
              description: description.trim() || null,
              skills,
            })
          }}
        >
          <p className='text-xs text-muted-foreground'>* Indicates required</p>

          <div className='space-y-1'>
            <Label htmlFor='exp-title'>Title*</Label>
            <Input
              id='exp-title'
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder='Ex: Technical Lead'
            />
          </div>

          <div className='space-y-1'>
            <Label>Employment type</Label>
            <Select
              value={employmentType ?? NONE}
              onValueChange={(v) =>
                setEmploymentType(v === NONE ? null : (v as EmploymentType))
              }
            >
              <SelectTrigger className='w-full'>
                <SelectValue placeholder='Please select' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>Please select</SelectItem>
                {EMPLOYMENT_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className='space-y-1'>
            <Label htmlFor='exp-company'>Company or organization*</Label>
            <Input
              id='exp-company'
              required
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder='Ex: Acme'
            />
          </div>

          <div className='flex items-center gap-2'>
            <Checkbox
              id='exp-current'
              checked={isCurrent}
              onCheckedChange={(v) => setIsCurrent(v === true)}
            />
            <Label htmlFor='exp-current' className='font-normal'>
              I am currently working in this role
            </Label>
          </div>

          <MonthYear
            label='Start date'
            required
            month={startMonth}
            year={startYear}
            onChange={(m, y) => {
              setStartMonth(m)
              setStartYear(y)
            }}
          />
          {!isCurrent && (
            <MonthYear
              label='End date'
              required
              month={endMonth}
              year={endYear}
              onChange={(m, y) => {
                setEndMonth(m)
                setEndYear(y)
              }}
            />
          )}
          {endBeforeStart && (
            <p className='text-sm text-destructive'>
              End date cannot be before the start date.
            </p>
          )}

          <div className='space-y-1'>
            <Label htmlFor='exp-location'>Location</Label>
            <Input
              id='exp-location'
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder='Ex: Muscat, Oman'
            />
          </div>

          <div className='space-y-1'>
            <Label>Location type</Label>
            <Select
              value={workplaceType ?? NONE}
              onValueChange={(v) =>
                setWorkplaceType(v === NONE ? null : (v as WorkplaceType))
              }
            >
              <SelectTrigger className='w-full'>
                <SelectValue placeholder='Please select' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>Please select</SelectItem>
                {WORKPLACE_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className='space-y-1'>
            <Label htmlFor='exp-description'>Description</Label>
            <Textarea
              id='exp-description'
              rows={8}
              maxLength={DESCRIPTION_MAX}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder='• Start each achievement on its own line'
            />
            <p className='text-right text-xs text-muted-foreground'>
              {description.length}/{DESCRIPTION_MAX.toLocaleString()}
            </p>
          </div>

          <div className='space-y-2'>
            <Label>Skills</Label>
            <p className='text-xs text-muted-foreground'>
              We recommend adding your top 5 used in this role.
            </p>
            <div className='flex flex-wrap gap-2'>
              {skills.map((s) => (
                <span
                  key={s}
                  className='flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-sm'
                >
                  {s}
                  <button
                    type='button'
                    aria-label={`Remove ${s}`}
                    onClick={() => setSkills(skills.filter((x) => x !== s))}
                  >
                    <X className='h-3 w-3' />
                  </button>
                </span>
              ))}
            </div>
            <div className='flex gap-2'>
              <Input
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addSkill()
                  }
                }}
                placeholder='Add a skill'
              />
              <Button type='button' variant='outline' onClick={addSkill}>
                <Plus className='mr-1 h-4 w-4' /> Add skill
              </Button>
            </div>
          </div>
        </form>

        <DialogFooter className='sm:justify-between'>
          {experience ? (
            <Button
              type='button'
              variant='ghost'
              className='text-destructive'
              disabled={isDeleting}
              onClick={onDelete}
            >
              Delete
            </Button>
          ) : (
            <span />
          )}
          <Button
            type='submit'
            form='experience-form'
            disabled={!canSave || isSaving}
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
