import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Check, ChevronsUpDown } from 'lucide-react'
import { http } from '@/lib/http'
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

interface ModelList {
  models: string[]
  // Why the list is only a set of suggestions (no key, or the provider did not answer).
  problem: string | null
}

const modelsApi = {
  list: (provider: string) =>
    http
      .get<ModelList>(`/api/Settings/ai/models/${provider}`)
      .then((r) => r.data),
}

// A searchable list of the provider's models. Any other name can still be typed and chosen, so a brand-new
// model, or a provider whose list cannot be read, never blocks the administrator.
export function ModelCombobox({
  provider,
  value,
  placeholder,
  label,
  onChange,
}: {
  provider: string | null
  value: string
  // The model used when nothing is chosen, shown while the field is empty.
  placeholder: string
  label: string
  onChange: (model: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')

  // Fetched when the list is first opened, and kept for a while: the provider's list rarely changes.
  const { data, isLoading, isError } = useQuery({
    queryKey: ['ai-models', provider],
    queryFn: () => modelsApi.list(provider!),
    enabled: open && !!provider,
    staleTime: 10 * 60 * 1000,
  })

  const models = data?.models ?? []
  const typed = search.trim()
  const canUseTyped = typed.length > 0 && !models.includes(typed)

  function choose(model: string) {
    onChange(model)
    setOpen(false)
    setSearch('')
  }

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) setSearch('')
      }}
    >
      <PopoverTrigger asChild>
        <Button
          type='button'
          variant='outline'
          role='combobox'
          aria-expanded={open}
          aria-label={label}
          disabled={!provider}
          className='w-full justify-between font-normal'
        >
          <span className={cn('truncate', !value && 'text-muted-foreground')}>
            {value || placeholder}
          </span>
          <ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className='w-(--radix-popover-trigger-width) min-w-72 p-0'
        align='start'
      >
        <Command>
          <CommandInput
            placeholder='Search or type a model name'
            value={search}
            onValueChange={setSearch}
          />
          {(data?.problem || isError) && (
            <p className='border-b px-3 py-2 text-xs text-muted-foreground'>
              {data?.problem ?? 'The model list could not be loaded.'}
            </p>
          )}
          <CommandList>
            {isLoading ? (
              <p className='px-3 py-4 text-sm text-muted-foreground'>
                Loading models…
              </p>
            ) : (
              <>
                {canUseTyped ? (
                  // Outside the group: cmdk hides a group whose own items matched nothing, and this one is always shown.
                  <CommandItem
                    forceMount
                    value={`use ${typed}`}
                    onSelect={() => choose(typed)}
                  >
                    Use “{typed}”
                  </CommandItem>
                ) : (
                  <CommandEmpty>
                    No model matches. Type a name to use it.
                  </CommandEmpty>
                )}
                <CommandGroup>
                  {value && (
                    <CommandItem
                      value='use the default model'
                      keywords={['default', 'clear']}
                      onSelect={() => choose('')}
                    >
                      Use the default model ({placeholder})
                    </CommandItem>
                  )}
                  {models.map((model) => (
                    <CommandItem
                      key={model}
                      value={model}
                      onSelect={() => choose(model)}
                    >
                      <Check
                        className={cn(
                          'mr-2 h-4 w-4',
                          value === model ? 'opacity-100' : 'opacity-0'
                        )}
                      />
                      {model}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
