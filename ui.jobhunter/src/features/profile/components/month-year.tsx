import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { MONTHS, YEARS } from '../lib/experience'

export function MonthYear({
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
