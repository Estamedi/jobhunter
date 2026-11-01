import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { http } from '@/lib/http'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Skeleton } from '@/components/ui/skeleton'
import { ContentSection } from '../components/content-section'

interface AiSettings {
  provider: string
  providers: { name: string; configured: boolean }[]
}

const DESCRIPTIONS: Record<string, string> = {
  OpenRouter: 'One key for many models, with a live credit balance on OpenRouter.',
  Anthropic: 'Claude models, billed directly by Anthropic.',
  OpenAI: 'GPT models, billed directly by OpenAI.',
}

const aiSettingsApi = {
  get: () => http.get<AiSettings>('/api/Settings/ai').then((r) => r.data),
  update: (provider: string) => http.put('/api/Settings/ai', { provider }),
}

export function SettingsAiProvider() {
  const qc = useQueryClient()
  const { data, isLoading } = useQuery({ queryKey: ['ai-settings'], queryFn: aiSettingsApi.get })
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
      desc='Choose which service handles CV writing, job extraction and profile import. API keys are set on the server.'
    >
      {isLoading || !data ? (
        <Skeleton className='h-40 w-full' />
      ) : (
        <div className='space-y-4'>
          <RadioGroup value={value} onValueChange={setSelected} className='space-y-2'>
            {data.providers.map((p) => (
              <Label
                key={p.name}
                htmlFor={`ai-${p.name}`}
                className='flex cursor-pointer items-start gap-3 rounded-lg border p-4 font-normal'
              >
                <RadioGroupItem id={`ai-${p.name}`} value={p.name} className='mt-1' />
                <div className='flex-1 space-y-1'>
                  <div className='flex items-center gap-2'>
                    <span className='font-medium'>{p.name}</span>
                    <Badge variant={p.configured ? 'secondary' : 'outline'}>
                      {p.configured ? 'Key configured' : 'No key'}
                    </Badge>
                  </div>
                  <p className='text-sm text-muted-foreground'>{DESCRIPTIONS[p.name]}</p>
                </div>
              </Label>
            ))}
          </RadioGroup>
          {data.providers.find((p) => p.name === value)?.configured === false && (
            <p className='text-sm text-muted-foreground'>
              This provider has no API key on the server, so requests will use the next provider that has one.
            </p>
          )}
          <Button disabled={save.isPending || value === data.provider} onClick={() => save.mutate(value)}>
            Save
          </Button>
        </div>
      )}
    </ContentSection>
  )
}
