import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { FileUp } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { candidatesApi } from '@/features/candidates/api'
import {
  profileApi,
  type ProfileEducation,
  type ProfileExperience,
  type SaveEducationDto,
  type SaveExperienceDto,
} from './api'
import { AboutCard } from './components/about-card'
import { ContactCard, type ContactValues } from './components/contact-card'
import { EducationDialog } from './components/education-dialog'
import { EducationSection } from './components/education-section'
import { ExperienceDialog } from './components/experience-dialog'
import { ExperienceSection } from './components/experience-section'
import {
  CertificationsSection,
  LanguagesSection,
  LinksSection,
  ProjectsSection,
} from './components/extra-sections'
import { ImportDialog } from './components/import-dialog'
import { SkillsSection } from './components/skills-section'

export function Profile() {
  const qc = useQueryClient()
  // `undefined` = closed, `null` = adding a new experience, otherwise editing that one.
  const [editing, setEditing] = useState<ProfileExperience | null | undefined>(
    undefined
  )

  const [importOpen, setImportOpen] = useState(false)
  const [editingEducation, setEditingEducation] = useState<
    ProfileEducation | null | undefined
  >(undefined)

  const { data: candidatesResult, isLoading: candidateLoading } = useQuery({
    queryKey: ['candidates', 'me'],
    queryFn: () => candidatesApi.mine(),
  })
  const candidate = candidatesResult?.items[0]

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['profile', candidate?.id],
    queryFn: () => profileApi.get(candidate!.id),
    enabled: !!candidate,
  })

  const refresh = () => qc.invalidateQueries({ queryKey: ['profile'] })

  const saveAbout = useMutation({
    mutationFn: async (v: {
      fullName: string
      headline: string
      summary: string
    }) => {
      if (v.fullName !== candidate!.fullName) {
        await profileApi.updateContact({
          candidateId: candidate!.id,
          fullName: v.fullName,
          email: candidate!.email,
          phone: candidate!.phone || null,
          currentLocation: candidate!.currentLocation || null,
        })
      }
      return profileApi.updateAbout({
        candidateId: candidate!.id,
        headline: v.headline.trim() || null,
        summary: v.summary.trim() || null,
      })
    },
    onSuccess: () => {
      refresh()
      qc.invalidateQueries({ queryKey: ['candidates'] })
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

  const saveContact = useMutation({
    mutationFn: (v: ContactValues) =>
      profileApi.updateContact({
        candidateId: candidate!.id,
        fullName: candidate!.fullName,
        email: v.email.trim(),
        phone: v.phone.trim() || null,
        currentLocation: v.currentLocation.trim() || null,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['candidates'] })
      toast.success('Contact info updated')
    },
    onError: () => toast.error('Failed to update contact info'),
  })

  const saveEducation = useMutation({
    mutationFn: (dto: SaveEducationDto) =>
      editingEducation
        ? profileApi.updateEducation(editingEducation.id, dto)
        : profileApi.addEducation(candidate!.id, dto),
    onSuccess: () => {
      refresh()
      setEditingEducation(undefined)
      toast.success('Education saved')
    },
    onError: () => toast.error('Failed to save education'),
  })

  const removeEducation = useMutation({
    mutationFn: (id: number) => profileApi.deleteEducation(id),
    onSuccess: () => {
      refresh()
      setEditingEducation(undefined)
      toast.success('Education deleted')
    },
    onError: () => toast.error('Failed to delete education'),
  })

  const addSkill = useMutation({
    mutationFn: (v: { name: string; category: string }) =>
      profileApi.addSkill(candidate!.id, v.name, v.category),
    onSuccess: refresh,
    onError: () => toast.error('Failed to add skill'),
  })

  const removeSkill = useMutation({
    mutationFn: (id: number) => profileApi.deleteSkill(id),
    onSuccess: refresh,
    onError: () => toast.error('Failed to remove skill'),
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
        onSave={(fullName, headline, summary, done) =>
          saveAbout.mutate(
            { fullName, headline, summary },
            { onSuccess: done }
          )
        }
      />

      <ContactCard
        values={{
          fullName: candidate.fullName,
          email: candidate.email,
          phone: candidate.phone ?? '',
          currentLocation: candidate.currentLocation ?? '',
        }}
        isSaving={saveContact.isPending}
        onSave={(v, done) => saveContact.mutate(v, { onSuccess: done })}
      />

      <ExperienceSection
        experiences={profile.experiences}
        onAdd={() => setEditing(null)}
        onEdit={(role) => setEditing(role)}
      />

      <EducationSection
        educations={profile.educations}
        onAdd={() => setEditingEducation(null)}
        onEdit={(e) => setEditingEducation(e)}
      />

      <SkillsSection
        skills={profile.skills}
        isAdding={addSkill.isPending}
        onAdd={(name, category) => addSkill.mutate({ name, category })}
        onRemove={(skill) => removeSkill.mutate(skill.id)}
      />

      <ProjectsSection candidateId={candidate.id} items={profile.projects} />
      <CertificationsSection
        candidateId={candidate.id}
        items={profile.certifications}
      />
      <LanguagesSection candidateId={candidate.id} items={profile.languages} />
      <LinksSection candidateId={candidate.id} items={profile.links} />

      {editingEducation !== undefined && (
        <EducationDialog
          key={editingEducation?.id ?? 'new'}
          education={editingEducation}
          isSaving={saveEducation.isPending}
          isDeleting={removeEducation.isPending}
          onOpenChange={(open) => !open && setEditingEducation(undefined)}
          onSave={(dto) => saveEducation.mutate(dto)}
          onDelete={() =>
            editingEducation && removeEducation.mutate(editingEducation.id)
          }
        />
      )}

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
