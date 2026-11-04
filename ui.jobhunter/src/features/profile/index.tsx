import { useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'
import { candidatesApi } from '@/features/candidates/api'
import {
  profileGaps,
  type ProfileGap,
} from '@/features/cv-builder/lib/profile-check'
import {
  profileApi,
  type ProfileEducation,
  type ProfileExperience,
  type SaveEducationDto,
  type SaveExperienceDto,
  type SaveSkillDto,
} from './api'
import { AboutCard } from './components/about-card'
import { ContactDialog, type ContactValues } from './components/contact-dialog'
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
import { IntroDialog } from './components/intro-dialog'
import {
  ProfileHeader,
  type ProfileHeaderHandle,
} from './components/profile-header'
import { ProfileStrength } from './components/profile-strength'
import { SkillsSection } from './components/skills-section'
import { isPhotoFile, MAX_PHOTO_INPUT_BYTES, preparePhoto } from './lib/photo'
import { currentRole, latestSchool } from './lib/profile-summary'
import { useCandidatePhoto } from './lib/use-candidate-photo'

export function Profile() {
  const qc = useQueryClient()
  // `undefined` = closed, `null` = adding a new experience, otherwise editing that one.
  const [editing, setEditing] = useState<ProfileExperience | null | undefined>(
    undefined
  )

  const [importOpen, setImportOpen] = useState(false)
  const [introOpen, setIntroOpen] = useState(false)
  const [contactOpen, setContactOpen] = useState(false)
  // A number per section that goes up to ask that section to open its "add" dialog.
  const [signals, setSignals] = useState<Record<string, number>>({})
  const requestOpen = (key: string) =>
    setSignals((v) => ({ ...v, [key]: (v[key] ?? 0) + 1 }))
  const header = useRef<ProfileHeaderHandle>(null)
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
          availability: candidate!.availability || null,
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

  const { url: photoUrl, isLoading: photoLoading } = useCandidatePhoto(
    candidate?.id
  )

  const savePhoto = useMutation({
    mutationFn: async (file: File) => {
      if (!isPhotoFile(file))
        throw new Error('Choose a JPEG, PNG or WebP picture.')
      if (file.size > MAX_PHOTO_INPUT_BYTES)
        throw new Error('That picture is too large (15 MB at most).')
      await profileApi.savePhoto(candidate!.id, await preparePhoto(file))
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['candidate-photo', candidate?.id] })
      toast.success('Photo saved')
    },
    onError: (error) =>
      toast.error(
        error instanceof Error && error.message
          ? error.message
          : 'Failed to save the photo'
      ),
  })

  const removePhoto = useMutation({
    mutationFn: () => profileApi.deletePhoto(candidate!.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['candidate-photo', candidate?.id] })
      toast.success('Photo removed')
    },
    onError: () => toast.error('Failed to remove the photo'),
  })

  const saveContact = useMutation({
    mutationFn: (v: ContactValues) =>
      profileApi.updateContact({
        candidateId: candidate!.id,
        fullName: candidate!.fullName,
        email: v.email.trim(),
        phone: v.phone.trim() || null,
        currentLocation: v.currentLocation.trim() || null,
        availability: v.availability.trim() || null,
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
    mutationFn: (v: {
      name: string
      category: string
      evidenceLevel: string
      note: string
    }) =>
      profileApi.addSkill(
        candidate!.id,
        v.name,
        v.category,
        v.evidenceLevel,
        v.note
      ),
    onSuccess: refresh,
    onError: () => toast.error('Failed to add skill'),
  })

  const updateSkill = useMutation({
    mutationFn: (v: { id: number; dto: SaveSkillDto }) =>
      profileApi.updateSkill(v.id, v.dto),
    onSuccess: refresh,
    onError: () => toast.error('Failed to update skill'),
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

  const addSections = [
    { key: 'experience', label: 'Experience' },
    { key: 'education', label: 'Education' },
    { key: 'skills', label: 'Skills' },
    { key: 'projects', label: 'Projects' },
    { key: 'certifications', label: 'Certifications' },
    { key: 'languages', label: 'Languages' },
    { key: 'links', label: 'Links' },
  ]

  const addSection = (key: string) => {
    if (key === 'experience') setEditing(null)
    else if (key === 'education') setEditingEducation(null)
    else requestOpen(key)
  }

  // What is still missing, for the checklist beside the profile. A photo that is still loading counts as there.
  const gaps = profileGaps({
    skills: profile.skills.length,
    email: candidate.email,
    phone: candidate.phone,
    location: candidate.currentLocation,
    hasPhoto: photoUrl !== null || photoLoading,
    headline: profile.headline,
    about: profile.summary,
    experiences: profile.experiences.length,
    educations: profile.educations.length,
  })

  const fixGap = (id: ProfileGap['id']) => {
    if (id === 'photo') header.current?.openPhotoPicker()
    else if (id === 'headline') setIntroOpen(true)
    else if (id === 'about') requestOpen('about')
    else if (id === 'experience') setEditing(null)
    else if (id === 'education') setEditingEducation(null)
    else if (id === 'skills') requestOpen('skills')
    else setContactOpen(true)
  }

  const contactValues: ContactValues = {
    fullName: candidate.fullName,
    email: candidate.email,
    phone: candidate.phone ?? '',
    currentLocation: candidate.currentLocation ?? '',
    availability: candidate.availability ?? '',
  }

  return (
    <div className='mx-auto grid max-w-5xl gap-4 lg:grid-cols-[minmax(0,1fr)_19rem]'>
      <div className='min-w-0 space-y-4'>
        <ProfileHeader
          ref={header}
          fullName={candidate.fullName}
          headline={profile.headline}
          location={candidate.currentLocation}
          availability={candidate.availability}
          photoUrl={photoUrl}
          photoLoading={photoLoading}
          photoBusy={savePhoto.isPending || removePhoto.isPending}
          role={currentRole(profile.experiences)}
          school={latestSchool(profile.educations)}
          addSections={addSections}
          onPickPhoto={(file) => savePhoto.mutate(file)}
          onRemovePhoto={() => removePhoto.mutate()}
          onEditIntro={() => setIntroOpen(true)}
          onOpenContact={() => setContactOpen(true)}
          onImport={() => setImportOpen(true)}
          onAddSection={addSection}
        />

        <AboutCard
          summary={profile.summary}
          isSaving={saveAbout.isPending}
          openEditSignal={signals.about ?? 0}
          onSave={(summary, done) =>
            // The name and headline are sent as they are, because one save carries all three.
            saveAbout.mutate(
              {
                fullName: candidate.fullName,
                headline: profile.headline ?? '',
                summary,
              },
              { onSuccess: done }
            )
          }
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
          isUpdating={updateSkill.isPending}
          openAddSignal={signals.skills ?? 0}
          onAdd={(skill) => addSkill.mutate(skill)}
          onUpdate={(id, dto) => updateSkill.mutate({ id, dto })}
          onRemove={(skill) => removeSkill.mutate(skill.id)}
        />

        <ProjectsSection
          candidateId={candidate.id}
          items={profile.projects}
          openAddSignal={signals.projects ?? 0}
        />
        <CertificationsSection
          candidateId={candidate.id}
          items={profile.certifications}
          openAddSignal={signals.certifications ?? 0}
        />
        <LanguagesSection
          candidateId={candidate.id}
          items={profile.languages}
          openAddSignal={signals.languages ?? 0}
        />
        <LinksSection
          candidateId={candidate.id}
          items={profile.links}
          openAddSignal={signals.links ?? 0}
        />
      </div>

      <aside className='min-w-0 space-y-4 lg:sticky lg:top-20 lg:self-start'>
        <ProfileStrength gaps={gaps} onFix={fixGap} />
      </aside>

      <IntroDialog
        open={introOpen}
        onOpenChange={setIntroOpen}
        fullName={candidate.fullName}
        headline={profile.headline ?? ''}
        isSaving={saveAbout.isPending}
        onSave={(fullName, headline) =>
          // The About text is sent as it is, because one save carries all three.
          saveAbout.mutate(
            { fullName, headline, summary: profile.summary ?? '' },
            { onSuccess: () => setIntroOpen(false) }
          )
        }
      />

      <ContactDialog
        open={contactOpen}
        onOpenChange={setContactOpen}
        values={contactValues}
        isSaving={saveContact.isPending}
        onSave={(v) =>
          saveContact.mutate(v, { onSuccess: () => setContactOpen(false) })
        }
      />

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
