import { useState, type FormEvent } from 'react'
import { isAxiosError } from 'axios'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { http } from '@/lib/http'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export interface ProviderStatus {
  name: string
  configured: boolean
  // Where the key in use comes from: saved here ("settings"), the server's configuration ("config"), or none.
  source: 'settings' | 'config' | null
  // The last characters of a key saved here, so the administrator can tell which key it is.
  hint: string | null
  // A key was saved but can no longer be read, so it is not used.
  savedKeyUnreadable: boolean
}

const keysApi = {
  save: (provider: string, apiKey: string) =>
    http.put(`/api/Settings/ai/keys/${provider}`, { apiKey }),
  remove: (provider: string) =>
    http.delete(`/api/Settings/ai/keys/${provider}`),
}

function failureMessage(error: unknown, fallback: string) {
  if (isAxiosError(error)) {
    const errors = error.response?.data?.errors as
      | Record<string, string[]>
      | undefined
    const first = errors && Object.values(errors).flat()[0]
    if (first) return first
  }
  return fallback
}

function statusText(p: ProviderStatus) {
  if (p.source === 'settings') {
    return p.hint ? `Saved here, ends in ${p.hint}` : 'Saved here'
  }
  if (p.source === 'config') return 'Set on the server'
  return 'No key'
}

function KeyRow({ provider }: { provider: ProviderStatus }) {
  const qc = useQueryClient()
  const [key, setKey] = useState('')
  // A new or removed key changes which models the provider lists, so that list is read again too.
  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['ai-settings'] })
    qc.invalidateQueries({ queryKey: ['ai-models', provider.name] })
  }

  const save = useMutation({
    mutationFn: () => keysApi.save(provider.name, key.trim()),
    onSuccess: () => {
      setKey('')
      refresh()
      toast.success(`${provider.name} key saved`)
    },
    onError: (error) =>
      toast.error(failureMessage(error, 'Could not save the key')),
  })

  const remove = useMutation({
    mutationFn: () => keysApi.remove(provider.name),
    onSuccess: () => {
      refresh()
      toast.success(`${provider.name} key removed`)
    },
    onError: () => toast.error('Could not remove the key'),
  })

  function submit(event: FormEvent) {
    event.preventDefault()
    if (key.trim()) save.mutate()
  }

  const hasSaved = provider.source === 'settings' || provider.savedKeyUnreadable

  return (
    <form
      onSubmit={submit}
      className='space-y-2 rounded-lg border p-4'
      aria-label={`${provider.name} API key`}
    >
      <div className='flex flex-wrap items-center gap-2'>
        <span className='font-medium'>{provider.name}</span>
        <Badge variant={provider.configured ? 'secondary' : 'outline'}>
          {statusText(provider)}
        </Badge>
      </div>
      {provider.savedKeyUnreadable && (
        <p className='text-sm text-destructive'>
          The key saved here can no longer be read, so it is not used. Enter it
          again or remove it.
        </p>
      )}
      <div className='flex flex-wrap gap-2'>
        <Input
          type='password'
          autoComplete='off'
          className='min-w-64 flex-1'
          aria-label={`${provider.name} API key`}
          placeholder={
            hasSaved ? 'Enter a new key to replace it' : 'Paste the API key'
          }
          value={key}
          onChange={(e) => setKey(e.target.value)}
        />
        <Button type='submit' disabled={!key.trim() || save.isPending}>
          Save key
        </Button>
        {hasSaved && (
          <Button
            type='button'
            variant='outline'
            disabled={remove.isPending}
            onClick={() => remove.mutate()}
          >
            Remove
          </Button>
        )}
      </div>
    </form>
  )
}

// One row per provider, so each key is saved and removed on its own. A key saved here is used instead of the
// one set on the server; removing it goes back to the server's key, if there is one.
export function ProviderKeys({ providers }: { providers: ProviderStatus[] }) {
  return (
    <div className='space-y-3 pt-4'>
      <div>
        <h4 className='font-medium'>API keys</h4>
        <p className='text-sm text-muted-foreground'>
          A key saved here is stored encrypted and is used instead of the key
          set on the server. Removing it goes back to the server&apos;s key. A
          saved key is never shown again, only its last characters.
        </p>
      </div>
      {providers.map((p) => (
        <KeyRow key={p.name} provider={p} />
      ))}
    </div>
  )
}
