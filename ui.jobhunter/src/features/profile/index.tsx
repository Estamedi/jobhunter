import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { FileUp } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { candidatesApi } from '@/features/candidates/api'
import {
  profileApi,
  type ProfileExperience,
  type SaveExperienceDto,
} from './api'
import { AboutCard } from './components/about-card'
import { ExperienceDialog } from './components/experience-dialog'
import { ExperienceSection } from './components/experience-section'
import { ImportDialog } from './components/import-dialog'

export function Profile() {
  const qc = useQueryClient()
  // `undefined` = closed, `null` = adding a new experience, otherwise editing that one.
  const [editing, setEditing] = useState<ProfileExperience | null | undefined>(
    undefined
  )

  const [importOpen, setImportOpen] = useState(false)

  const { data: candidatesResult, isLoading: candidateLoading } = useQuery({
    queryKey: ['candidates', 'me'],
    queryFn: () => candidatesApi.list({ pageSize: 1 }),
  })
  const candidate = candidatesResult?.items[0]

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['profile', candidate?.id],
    queryFn: () => profileApi.get(candidate!.id),
    enabled: !!candidate,
  })

  const refresh = () => qc.invalidateQueries({ queryKey: ['profile'] })

  const saveAbout = useMutation({
    mutationFn: (v: { headline: string; summary: string }) =>
      profileApi.updateAbout({
        candidateId: candidate!.id,
        headline: v.headline.trim() || null,
        summary: v.summary.trim() || null,
      }),
    onSuccess: () => {
      refresh()
      toast.success('Profile updated')
    },
    onError: () => toast.error('Failed to update profile'),
  })

  const saveExperience = useMutation({
    mutationFn: (dto: SaveExperienceDto) =>
      editing
        ? profileApi.updateExperience(editing.id, dto)
        : profileApi.addExperience(candidate!.id, dto),
    onSuccess: () => {
      refresh()
      setEditing(undefined)
      toast.success('Experience saved')
    },
    onError: () => toast.error('Failed to save experience'),
  })

  const removeExperience = useMutation({
    mutationFn: (id: number) => profileApi.deleteExperience(id),
    onSuccess: () => {
      refresh()
      setEditing(undefined)
      toast.success('Experience deleted')
    },
    onError: () => toast.error('Failed to delete experience'),
  })

  if (!candidateLoading && !candidate) {
    return (
      <div className='rounded-md border py-12 text-center text-muted-foreground'>
        No candidate profile found for your account yet.
      </div>
    )
  }

  if (candidateLoading || profileLoading || !candidate || !profile) {
    return <Skeleton className='h-96 w-full' />
  }

  return (
    <div className='mx-auto max-w-3xl space-y-4'>
      <div className='flex justify-end'>
        <Button variant='outline' onClick={() => setImportOpen(true)}>
          <FileUp className='mr-1 h-4 w-4' /> Import from CV
        </Button>
      </div>

      <AboutCard
        fullName={candidate.fullName}
        headline={profile.headline}
        summary={profile.summary}
        isSaving={saveAbout.isPending}
        onSave={(headline, summary, done) =>
          saveAbout.mutate({ headline, summary }, { onSuccess: done })
        }
      />

      <ExperienceSection
        experiences={profile.experiences}
        onAdd={() => setEditing(null)}
        onEdit={(role) => setEditing(role)}
      />

      {importOpen && (
        <ImportDialog
          candidateId={candidate.id}
          onOpenChange={(open) => !open && setImportOpen(false)}
          onImported={(added) => {
            refresh()
            qc.invalidateQueries({ queryKey: ['cvs'] })
            setImportOpen(false)
            toast.success(
              added === 1
                ? 'Imported 1 experience'
                : `Imported ${added} experiences`
            )
          }}
        />
      )}

      {editing !== undefined && (
        <ExperienceDialog
          key={editing?.id ?? 'new'}
          open
          experience={editing}
          isSaving={saveExperience.isPending}
          isDeleting={removeExperience.isPending}
          onOpenChange={(open) => !open && setEditing(undefined)}
          onSave={(dto) => saveExperience.mutate(dto)}
          onDelete={() => editing && removeExperience.mutate(editing.id)}
        />
      )}
    </div>
  )
}
