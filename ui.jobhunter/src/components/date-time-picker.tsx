import { format } from 'date-fns'
import { Calendar as CalendarIcon } from 'lucide-react'
import { Controller, type Control, type FieldValues, type Path } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

type DateTimePickerProps = {
  // Local "yyyy-MM-ddTHH:mm" string (the same format a datetime-local input uses).
  value: string | undefined
  onChange: (value: string) => void
}

const parse = (value: string | undefined) => {
  if (!value) return undefined
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? undefined : d
}

export function DateTimePicker({ value, onChange }: DateTimePickerProps) {
  const date = parse(value)
  const time = date ? format(date, 'HH:mm') : '09:00'

  const emit = (day: Date, hhmm: string) => onChange(`${format(day, 'yyyy-MM-dd')}T${hhmm}`)

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type='button'
          variant='outline'
          data-empty={!date}
          className='w-full justify-start text-start font-normal data-[empty=true]:text-muted-foreground'
        >
          {date ? format(date, 'MMM d, yyyy HH:mm') : <span>Pick date & time</span>}
          <CalendarIcon className='ms-auto h-4 w-4 opacity-50' />
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-auto p-0'>
        <Calendar
          mode='single'
          captionLayout='dropdown'
          selected={date}
          defaultMonth={date}
          onSelect={(d: Date | undefined) => d && emit(d, time)}
        />
        <div className='border-t p-3'>
          <Input
            type='time'
            value={time}
            onChange={(e) => emit(date ?? new Date(), e.target.value || '00:00')}
          />
        </div>
      </PopoverContent>
    </Popover>
  )
}

export function FormDateTime<T extends FieldValues>({
  control,
  name,
  required,
}: {
  control: Control<T>
  name: Path<T>
  required?: boolean
}) {
  return (
    <Controller
      control={control}
      name={name}
      rules={required ? { required: true } : undefined}
      render={({ field }) => <DateTimePicker value={field.value} onChange={field.onChange} />}
    />
  )
}
