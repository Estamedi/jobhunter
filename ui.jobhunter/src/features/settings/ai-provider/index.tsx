import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { http } from '@/lib/http'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
import { ProviderKeys, type ProviderStatus } from './provider-keys'

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

  const save = useMutation({
    mutationFn: aiSettingsApi.update,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ai-settings'] })
      setSelected(null)
      toast.success('AI provider updated')
    },
  })

  return (
    <ContentSection
      title='AI provider'
      desc='Choose which service handles CV writing, job extraction and profile import. Add or replace the API key of each provider below.'
    >
      {isLoading || !data ? (
        <Skeleton className='h-40 w-full' />
      ) : (
        <div className='space-y-4'>
          <RadioGroup
            value={value}
            onValueChange={setSelected}
            className='space-y-2'
          >
            {data.providers.map((p) => (
              <Label
                key={p.name}
                htmlFor={`ai-${p.name}`}
                className='flex cursor-pointer items-start gap-3 rounded-lg border p-4 font-normal'
              >
                <RadioGroupItem
                  id={`ai-${p.name}`}
                  value={p.name}
                  className='mt-1'
                />
                <div className='flex-1 space-y-1'>
                  <div className='flex items-center gap-2'>
                    <span className='font-medium'>{p.name}</span>
                    <Badge variant={p.configured ? 'secondary' : 'outline'}>
                      {p.configured ? 'Key configured' : 'No key'}
                    </Badge>
                  </div>
                  <p className='text-sm text-muted-foreground'>
                    {DESCRIPTIONS[p.name]}
                  </p>
                </div>
              </Label>
            ))}
          </RadioGroup>
          {data.providers.find((p) => p.name === value)?.configured ===
            false && (
            <p className='text-sm text-muted-foreground'>
              This provider has no API key, so requests will use the next
              provider that has one.
            </p>
          )}
          <Button
            disabled={save.isPending || value === data.provider}
            onClick={() => save.mutate(value)}
          >
            Save
          </Button>
          <ProviderKeys providers={data.providers} />
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
      toast.success('AI actions updated')
    },
  })

  return (
    <div className='space-y-3 pt-4'>
      <div>
        <h4 className='font-medium'>Provider and model per action</h4>
        <p className='text-sm text-muted-foreground'>
          Override the provider and model for a single action. Leave it on the
          default to use {defaultProvider} with the server&apos;s configured
          model. If the chosen provider has no key or is down, another provider
          with a key is used instead.
        </p>
      </div>
      {data.actions.map((a) => {
        const c = current(a)
        const shownProvider = c.provider ?? defaultProvider
        return (
          <div key={a.action} className='space-y-2 rounded-lg border p-4'>
            <div>
              <div className='font-medium'>{a.label}</div>
              <p className='text-sm text-muted-foreground'>{a.description}</p>
            </div>
            <div className='grid gap-2 sm:grid-cols-2'>
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
              <ModelCombobox
                label={`${a.label} model`}
                provider={c.provider}
                value={c.model}
                placeholder={a.defaultModels[shownProvider] ?? 'Model'}
                onChange={(model) =>
                  setEdits((prev) => ({
                    ...prev,
                    [a.action]: { provider: c.provider, model },
                  }))
                }
              />
            </div>
          </div>
        )
      })}
      <Button disabled={save.isPending || !dirty} onClick={() => save.mutate()}>
        Save actions
      </Button>
    </div>
  )
}
