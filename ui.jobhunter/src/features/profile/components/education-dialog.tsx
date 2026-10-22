import { useState } from 'react'
import { Button } from '@/components/ui/button'
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
import { type ProfileEducation, type SaveEducationDto } from '../api'
import { YEARS, parseYearMonth } from '../lib/experience'

const DETAILS_MAX = 2000
const NONE = '__none__'

function YearSelect({
  label,
  value,
  onChange,
}: {
  label: string
  value: number | null
  onChange: (year: number | null) => void
}) {
  return (
    <div className='space-y-1'>
      <Label>{label}</Label>
      <Select
        value={value ? String(value) : NONE}
        onValueChange={(v) => onChange(v === NONE ? null : Number(v))}
      >
        <SelectTrigger className='w-full'>
          <SelectValue placeholder='Year' />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={NONE}>Year</SelectItem>
          {YEARS.map((y) => (
            <SelectItem key={y} value={String(y)}>
              {y}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

export function EducationDialog({
  education,
  isSaving,
  isDeleting,
  onOpenChange,
  onSave,
  onDelete,
}: {
  education: ProfileEducation | null
  isSaving: boolean
  isDeleting: boolean
  onOpenChange: (open: boolean) => void
  onSave: (dto: SaveEducationDto) => void
  onDelete: () => void
}) {
  const [institution, setInstitution] = useState(education?.institution ?? '')
  const [degree, setDegree] = useState(education?.degree ?? '')
  const [field, setField] = useState(education?.fieldOfStudy ?? '')
  const [startYear, setStartYear] = useState<number | null>(
    parseYearMonth(education?.startDate)?.year ?? null
  )
  const [endYear, setEndYear] = useState<number | null>(
    parseYearMonth(education?.endDate)?.year ?? null
  )
  const [details, setDetails] = useState(education?.details ?? '')

  const endBeforeStart = !!startYear && !!endYear && endYear < startYear
  const canSave = !!institution.trim() && !!degree.trim() && !endBeforeStart

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className='max-h-[90vh] max-w-xl overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>
            {education ? 'Edit education' : 'Add education'}
          </DialogTitle>
        </DialogHeader>

        <form
          id='education-form'
          className='space-y-4'
          onSubmit={(e) => {
            e.preventDefault()
            if (!canSave) return
            onSave({
              institution: institution.trim(),
              degree: degree.trim(),
              fieldOfStudy: field.trim() || null,
              location: education?.location ?? null,
              startDate: startYear ? `${startYear}-01-01` : null,
              endDate: endYear ? `${endYear}-01-01` : null,
              details: details.trim() || null,
            })
          }}
        >
          <p className='text-xs text-muted-foreground'>* Indicates required</p>
          <div className='space-y-1'>
            <Label htmlFor='edu-school'>School*</Label>
            <Input
              id='edu-school'
              required
              value={institution}
              onChange={(e) => setInstitution(e.target.value)}
              placeholder='Ex: Boston University'
            />
          </div>
          <div className='space-y-1'>
            <Label htmlFor='edu-degree'>Degree*</Label>
            <Input
              id='edu-degree'
              required
              value={degree}
              onChange={(e) => setDegree(e.target.value)}
              placeholder="Ex: Bachelor's"
            />
          </div>
          <div className='space-y-1'>
            <Label htmlFor='edu-field'>Field of study</Label>
            <Input
              id='edu-field'
              value={field}
              onChange={(e) => setField(e.target.value)}
              placeholder='Ex: Computer Software Engineering'
            />
          </div>
          <div className='grid grid-cols-2 gap-3'>
            <YearSelect
              label='Start year'
              value={startYear}
              onChange={setStartYear}
            />
            <YearSelect
              label='End year (or expected)'
              value={endYear}
              onChange={setEndYear}
            />
          </div>
          {endBeforeStart && (
            <p className='text-sm text-destructive'>
              End year cannot be before the start year.
            </p>
          )}
          <div className='space-y-1'>
            <Label htmlFor='edu-details'>Description</Label>
            <Textarea
              id='edu-details'
              rows={4}
              maxLength={DETAILS_MAX}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder='Grade, activities, honours'
            />
            <p className='text-right text-xs text-muted-foreground'>
              {details.length}/{DETAILS_MAX.toLocaleString()}
            </p>
          </div>
        </form>

        <DialogFooter className='sm:justify-between'>
          {education ? (
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
            form='education-form'
            disabled={!canSave || isSaving}
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
