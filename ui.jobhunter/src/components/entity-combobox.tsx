import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Check, ChevronsUpDown, Loader2, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

export interface EntityOption {
  value: number
  label: string
}

interface EntityComboboxProps {
  value: EntityOption | null
  onChange: (option: EntityOption | null) => void
  queryKey: unknown[]
  fetchOptions: (search: string) => Promise<EntityOption[]>
  onCreate?: (name: string) => Promise<EntityOption>
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  createLabel?: (name: string) => string
  disabled?: boolean
  disabledPlaceholder?: string
}

export function EntityCombobox({
  value,
  onChange,
  queryKey,
  fetchOptions,
  onCreate,
  placeholder = 'Select...',
  searchPlaceholder = 'Search...',
  emptyText = 'No results found.',
  createLabel = (name) => `Create "${name}"`,
  disabled,
  disabledPlaceholder,
}: EntityComboboxProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(timeout)
  }, [search])

  // fetchOptions intentionally excluded from queryKey: callers key on the ids that parameterize it (e.g. companyId)
  // eslint-disable-next-line @tanstack/query/exhaustive-deps
  const { data: options = [], isFetching } = useQuery({
    queryKey: [...queryKey, debouncedSearch],
    queryFn: () => fetchOptions(debouncedSearch),
    enabled: open,
  })

  const trimmedSearch = search.trim()
  const hasExactMatch = options.some((o) => o.label.toLowerCase() === trimmedSearch.toLowerCase())
  const showCreate = Boolean(onCreate) && trimmedSearch.length > 0 && !hasExactMatch && !isFetching

  async function handleCreate() {
    if (!onCreate || !trimmedSearch) return
    setCreating(true)
    try {
      const option = await onCreate(trimmedSearch)
      onChange(option)
      setOpen(false)
      setSearch('')
    } finally {
      setCreating(false)
    }
  }

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (!next) setSearch('')
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          type='button'
          variant='outline'
          aria-expanded={open}
          aria-haspopup='listbox'
          disabled={disabled}
          className='w-full justify-between font-normal'
        >
          <span className={cn('min-w-0 flex-1 truncate text-left', !value && 'text-muted-foreground')}>
            {value?.label ?? (disabled ? (disabledPlaceholder ?? placeholder) : placeholder)}
          </span>
          <ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-(--radix-popover-trigger-width) p-0' align='start'>
        <Command shouldFilter={false}>
          <CommandInput placeholder={searchPlaceholder} value={search} onValueChange={setSearch} />
          <CommandList>
            {isFetching && (
              <div className='flex items-center justify-center py-4 text-sm text-muted-foreground'>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' /> Searching...
              </div>
            )}
            {!isFetching && options.length === 0 && !showCreate && <CommandEmpty>{emptyText}</CommandEmpty>}
            <CommandGroup>
              {showCreate && (
                <CommandItem value={`__create__${trimmedSearch}`} onSelect={handleCreate} disabled={creating}>
                  {creating ? <Loader2 className='h-4 w-4 animate-spin' /> : <Plus className='h-4 w-4' />}
                  {createLabel(trimmedSearch)}
                </CommandItem>
              )}
              {!isFetching &&
                options.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={String(option.value)}
                    onSelect={() => {
                      onChange(option)
                      setOpen(false)
                      setSearch('')
                    }}
                  >
                    <Check className={cn('h-4 w-4', value?.value === option.value ? 'opacity-100' : 'opacity-0')} />
                    {option.label}
                  </CommandItem>
                ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
