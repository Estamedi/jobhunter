import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, ChevronDown } from 'lucide-react'
import { toast } from 'sonner'
import { http } from '@/lib/http'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { ContentSection } from '../components/content-section'
import { ModelCombobox } from './model-combobox'
import { KeyForm, statusText, type ProviderStatus } from './provider-keys'

interface AiAction {
  action: string
  label: string
  description: string
  provider: string | null
  model: string | null
  defaultModels: Record<string, string>
}

interface AiSettings {
  provider: string
  providers: ProviderStatus[]
  actions: AiAction[]
}

type ActionChoice = { provider: string | null; model: string }

const USE_DEFAULT = '__default__'

const DESCRIPTIONS: Record<string, string> = {
  OpenRouter:
    'One key for many models, with a live credit balance on OpenRouter.',
  Anthropic: 'Claude models, billed directly by Anthropic.',
  OpenAI: 'GPT models, billed directly by OpenAI.',
}

const aiSettingsApi = {
  get: () => http.get<AiSettings>('/api/Settings/ai').then((r) => r.data),
  update: (provider: string) => http.put('/api/Settings/ai', { provider }),
  updateActions: (
    actions: { action: string; provider: string | null; model: string | null }[]
  ) => http.put('/api/Settings/ai/actions', { actions }),
}

export function SettingsAiProvider() {
  const qc = useQueryClient()
  const { data, isLoading } = useQuery({
    queryKey: ['ai-settings'],
    queryFn: aiSettingsApi.get,
  })
  const [selected, setSelected] = useState<string | null>(null)
  const value = selected ?? data?.provider ?? ''

  // The choice is saved as soon as it is made; the card shows it at once and the page confirms with a toast.
  const save = useMutation({
    mutationFn: aiSettingsApi.update,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ai-settings'] })
      toast.success('AI provider updated')
    },
    onError: () => toast.error('Could not change the AI provider'),
    onSettled: () => setSelected(null),
  })

  return (
    <ContentSection
      title='AI provider'
      desc='Choose which service handles CV writing, job extraction and profile import, and add its API key.'
    >
      {isLoading || !data ? (
        <Skeleton className='h-40 w-full' />
      ) : (
        <div className='space-y-6'>
          <RadioGroup
            value={value}
            onValueChange={(next) => {
              setSelected(next)
              save.mutate(next)
            }}
            className='space-y-3'
          >
            {data.providers.map((p) => (
              <div
                key={p.name}
                className={cn(
                  'space-y-3 rounded-lg border p-4',
                  value === p.name && 'border-primary'
                )}
              >
                <div className='flex items-start gap-3'>
                  <RadioGroupItem
                    id={`ai-${p.name}`}
                    value={p.name}
                    className='mt-1'
                  />
                  <Label
                    htmlFor={`ai-${p.name}`}
                    className='flex-1 cursor-pointer flex-col items-start gap-1 font-normal'
                  >
                    <span className='flex items-center gap-2'>
                      <span className='font-medium'>{p.name}</span>
                      <Badge variant={p.configured ? 'secondary' : 'outline'}>
                        {statusText(p)}
                      </Badge>
                    </span>
                    <span className='text-sm text-muted-foreground'>
                      {DESCRIPTIONS[p.name]}
                    </span>
                  </Label>
                </div>
                {value === p.name && !p.configured && (
                  <p
                    role='alert'
                    className='flex items-start gap-2 pl-7 text-sm text-amber-700 dark:text-amber-500'
                  >
                    <AlertTriangle className='mt-0.5 h-4 w-4 shrink-0' />
                    <span>
                      No key for {p.name}, so requests use the next provider
                      that has one. Save a key below to use {p.name}.
                    </span>
                  </p>
                )}
                <div className='pl-7'>
                  <KeyForm provider={p} />
                </div>
              </div>
            ))}
          </RadioGroup>
          <ActionOverrides data={data} defaultProvider={data.provider} />
        </div>
      )}
    </ContentSection>
  )
}

function ActionOverrides({
  data,
  defaultProvider,
}: {
  data: AiSettings
  defaultProvider: string
}) {
  const qc = useQueryClient()
  const [edits, setEdits] = useState<Record<string, ActionChoice>>({})
  const current = (a: AiAction): ActionChoice =>
    edits[a.action] ?? { provider: a.provider, model: a.model ?? '' }
  const dirty = data.actions.some((a) => {
    const c = current(a)
    return (
      c.provider !== a.provider ||
      (c.provider ? c.model.trim() : '') !== (a.model ?? '')
    )
  })

  const save = useMutation({
    mutationFn: () =>
      aiSettingsApi.updateActions(
        data.actions.map((a) => {
          const c = current(a)
          return {
            action: a.action,
            provider: c.provider,
            model: c.provider ? c.model.trim() || null : null,
          }
        })
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ai-settings'] })
      setEdits({})
      toast.success('Changes saved')
    },
  })

  const anyOverride = data.actions.some((a) => a.provider)
  const anyDifferentFromDefault = data.actions.some((a) => current(a).provider)

  return (
    <Collapsible defaultOpen={anyOverride} className='rounded-lg border'>
      <CollapsibleTrigger className='group flex w-full items-center justify-between p-4 text-left'>
        <span>
          <span className='block font-medium'>
            Advanced: provider and model per action
          </span>
          <span className='block text-sm text-muted-foreground'>
            {anyOverride
              ? 'Some actions use their own provider or model.'
              : `All actions use ${defaultProvider} and its default models.`}
          </span>
        </span>
        <ChevronDown className='h-4 w-4 shrink-0 transition-transform group-data-[state=open]:rotate-180' />
      </CollapsibleTrigger>
      <CollapsibleContent className='space-y-3 border-t p-4'>
        <p className='text-sm text-muted-foreground'>
          Overrides the default for one action. If the chosen provider has no
          key or is down, another provider with a key is used.
        </p>
        <div className='hidden grid-cols-[1fr_12rem_1fr] gap-3 px-1 text-xs font-medium text-muted-foreground sm:grid'>
          <span>Action</span>
          <span>Provider</span>
          <span>Model</span>
        </div>
        {data.actions.map((a) => {
          const c = current(a)
          const shownProvider = c.provider ?? defaultProvider
          const defaultModel = a.defaultModels[shownProvider] ?? 'Model'
          return (
            <div
              key={a.action}
              className='grid gap-2 border-t pt-3 first:border-t-0 first:pt-0 sm:grid-cols-[1fr_12rem_1fr] sm:items-center sm:gap-3'
            >
              <div>
                <div className='text-sm font-medium'>{a.label}</div>
                <p className='text-xs text-muted-foreground'>{a.description}</p>
              </div>
              <Select
                value={c.provider ?? USE_DEFAULT}
                onValueChange={(v) =>
                  setEdits((e) => ({
                    ...e,
                    [a.action]: {
                      provider: v === USE_DEFAULT ? null : v,
                      model: '',
                    },
                  }))
                }
              >
                <SelectTrigger aria-label={`${a.label} provider`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={USE_DEFAULT}>
                    Default ({defaultProvider})
                  </SelectItem>
                  {data.providers.map((p) => (
                    <SelectItem key={p.name} value={p.name}>
                      {p.name}
                      {p.configured ? '' : ' (no key)'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {c.provider ? (
                <ModelCombobox
                  label={`${a.label} model`}
                  provider={c.provider}
                  value={c.model}
                  placeholder={defaultModel}
                  onChange={(model) =>
                    setEdits((prev) => ({
                      ...prev,
                      [a.action]: { provider: c.provider, model },
                    }))
                  }
                />
              ) : (
                // On the default provider there is no model to pick: show the one that will be used, as plain text.
                <p className='px-1 text-sm text-muted-foreground'>
                  Uses {defaultModel}
                </p>
              )}
            </div>
          )
        })}
        <div className='flex flex-wrap gap-2 pt-1'>
          <Button
            disabled={save.isPending || !dirty}
            onClick={() => save.mutate()}
          >
            Save changes
          </Button>
          <Button
            variant='outline'
            disabled={save.isPending || !anyDifferentFromDefault}
            onClick={() =>
              setEdits(
                Object.fromEntries(
                  data.actions.map((a) => [
                    a.action,
                    { provider: null, model: '' },
                  ])
                )
              )
            }
          >
            Reset to defaults
          </Button>
          {dirty && (
            <span className='self-center text-sm text-muted-foreground'>
              Unsaved changes
            </span>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
