import { useState, type FormEvent } from 'react'
import { isAxiosError } from 'axios'
import { useTranslation } from 'react-i18next'
import i18n from '@/i18n'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'
import { http } from '@/lib/http'
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

// One vocabulary for where a provider's key comes from, shared by the provider card and its key field.
export function statusText(p: ProviderStatus) {
  if (p.source === 'settings') {
    return p.hint
      ? i18n.t('Your key ends in {{hint}}', { hint: p.hint })
      : i18n.t('Your key')
  }
  if (p.source === 'config') return i18n.t('Server key')
  return i18n.t('No key')
}

// The key field of one provider card: saved and removed on its own.
export function KeyForm({ provider }: { provider: ProviderStatus }) {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const [key, setKey] = useState('')
  const [shown, setShown] = useState(false)
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
      toast.success(t('Key saved'))
    },
    onError: (error) =>
      toast.error(failureMessage(error, t('Could not save the key'))),
  })

  const remove = useMutation({
    mutationFn: () => keysApi.remove(provider.name),
    onSuccess: () => {
      refresh()
      toast.success(t('Key removed'))
    },
    onError: () => toast.error(t('Could not remove the key')),
  })

  function submit(event: FormEvent) {
    event.preventDefault()
    if (key.trim()) save.mutate()
  }

  const hasSaved = provider.source === 'settings' || provider.savedKeyUnreadable

  return (
    <form
      onSubmit={submit}
      className='space-y-2'
      aria-label={t('{{name}} API key', { name: provider.name })}
    >
      {provider.savedKeyUnreadable && (
        <p className='text-sm text-destructive'>
          {t(
            'The key saved here can no longer be read, so it is not used. Enter it again or remove it.'
          )}
        </p>
      )}
      <div className='flex flex-wrap gap-2'>
        <div className='relative min-w-64 flex-1'>
          <Input
            type={shown ? 'text' : 'password'}
            autoComplete='off'
            className='pe-10'
            aria-label={t('{{name}} API key', { name: provider.name })}
            placeholder={
              hasSaved
                ? t('Enter a new key to replace it')
                : t('Paste the API key')
            }
            value={key}
            onChange={(e) => setKey(e.target.value)}
          />
          <Button
            type='button'
            variant='ghost'
            size='icon'
            className='absolute top-0 end-0 h-full w-9 text-muted-foreground'
            aria-label={shown ? t('Hide key') : t('Show key')}
            onClick={() => setShown((v) => !v)}
          >
            {shown ? (
              <EyeOff className='h-4 w-4' />
            ) : (
              <Eye className='h-4 w-4' />
            )}
          </Button>
        </div>
        <Button type='submit' disabled={!key.trim() || save.isPending}>
          {t('Save key')}
        </Button>
        {hasSaved && (
          <Button
            type='button'
            variant='outline'
            disabled={remove.isPending}
            onClick={() => remove.mutate()}
          >
            {t('Remove key')}
          </Button>
        )}
      </div>
    </form>
  )
}
