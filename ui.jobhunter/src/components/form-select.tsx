import { Controller, type Control, type FieldValues, type Path } from 'react-hook-form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

type Option = string | { value: string; label: string }

type FormSelectProps<T extends FieldValues> = {
  control: Control<T>
  name: Path<T>
  options: Option[]
}

// shadcn Select bound to react-hook-form, for forms that otherwise use `register`.
export function FormSelect<T extends FieldValues>({ control, name, options }: FormSelectProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <Select value={field.value ?? ''} onValueChange={field.onChange}>
          <SelectTrigger className='w-full'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {options.map((o) => {
              const { value, label } = typeof o === 'string' ? { value: o, label: o } : o
              return <SelectItem key={value} value={value}>{label}</SelectItem>
            })}
          </SelectContent>
        </Select>
      )}
    />
  )
}
