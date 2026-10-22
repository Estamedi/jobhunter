import { useState } from 'react'
import { format } from 'date-fns'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { FileDown, Loader2, Pencil, Sparkles, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { applicationsApi } from '@/features/applications/api'
import { candidatesApi } from '@/features/candidates/api'
import { cvsApi } from '@/features/cvs/api'
import { downloadCvFile } from '@/features/cvs/lib/cv-file'
import { jobRolesApi } from '@/features/job-roles/api'
import { profileApi } from '@/features/profile/api'
import {
  cvBuilderApi,
  type CvContent,
  type CvDraft,
  type CvDraftSummary,
  type CvSection,
} from './api'
import { CvEditor } from './components/cv-editor'
import { CvPreview } from './components/cv-preview'
import { WishlistPanel, type BatchProgress } from './components/wishlist-panel'
import { jobPostingText } from './lib/job-text'

const BACKGROUND_KEY = 'cvBuilder.background'

function loadBackground() {
  try {
    return localStorage.getItem(BACKGROUND_KEY) ?? ''
  } catch {
    return ''
  }
}

function saveBackground(value: string) {
  try {
    localStorage.setItem(BACKGROUND_KEY, value)
  } catch {
    // storage unavailable; the field simply isn't remembered
  }
}

const SECTION_LABELS: Record<CvSection, string> = {
  headline: 'headline',
  summary: 'summary',
  skills: 'skills',
  projects: 'projects',
  experience: 'experience',
  education: 'education',
  certifications: 'certifications',
  languages: 'languages',
  links: 'links',
}

interface GenerateFormData {
  jobTitle: string
  jobDescription: string
  instructions: string
  backgroundText: string
  tone: string
  language: string
}

function GenerateForm({
  isPending,
  initial,
  profileRoles,
  onSubmit,
}: {
  isPending: boolean
  profileRoles: number
  initial?: { jobTitle: string; jobDescription: string }
  onSubmit: (data: GenerateFormData) => void
}) {
  const [jobTitle, setJobTitle] = useState(initial?.jobTitle ?? '')
  const [jobDescription, setJobDescription] = useState(
    initial?.jobDescription ?? ''
  )
  const [instructions, setInstructions] = useState('')
  const [backgroundText, setBackgroundText] = useState(loadBackground)
  const [tone, setTone] = useState('')
  const [language, setLanguage] = useState('')

  return (
    <form
      className='space-y-3'
      onSubmit={(e) => {
        e.preventDefault()
        saveBackground(backgroundText)
        onSubmit({
          jobTitle,
          jobDescription,
          instructions,
          backgroundText,
          tone,
          language,
        })
      }}
    >
      <div className='space-y-1'>
        <Label>Job title *</Label>
        <Input
          required
          value={jobTitle}
          onChange={(e) => setJobTitle(e.target.value)}
          placeholder='e.g. Senior AI Engineer'
        />
      </div>
      <div className='space-y-1'>
        <Label>Job description</Label>
        <Textarea
          rows={6}
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          placeholder='Paste the job posting'
        />
      </div>
      <div className='rounded-md bg-muted/50 p-3 text-sm'>
        {profileRoles > 0 ? (
          <p>
            Writing from your profile ({profileRoles}{' '}
            {profileRoles === 1 ? 'role' : 'roles'}).{' '}
            <Link to='/profile' className='underline'>
              Edit profile
            </Link>
          </p>
        ) : (
          <p>
            Your profile has no experience yet.{' '}
            <Link to='/profile' className='underline'>
              Fill it in or import your CV
            </Link>
            , or paste your CV text below.
          </p>
        )}
      </div>
      <div className='space-y-1'>
        <Label>
          {profileRoles > 0
            ? 'Extra notes (optional)'
            : 'About you (experience, education, skills) *'}
        </Label>
        <Textarea
          required={profileRoles === 0}
          rows={profileRoles > 0 ? 4 : 8}
          value={backgroundText}
          onChange={(e) => setBackgroundText(e.target.value)}
          placeholder={
            profileRoles > 0
              ? 'Anything not on your profile that this CV should mention. Saved in this browser.'
              : 'Paste your current CV text. The AI only uses facts from here. Saved in this browser.'
          }
        />
      </div>
      <div className='space-y-1'>
        <Label>Instructions</Label>
        <Textarea
          rows={3}
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          placeholder='e.g. Emphasise leadership, keep it to one page'
        />
      </div>
      <div className='grid grid-cols-2 gap-2'>
        <div className='space-y-1'>
          <Label>Tone</Label>
          <Input
            value={tone}
            onChange={(e) => setTone(e.target.value)}
            placeholder='professional'
          />
        </div>
        <div className='space-y-1'>
          <Label>Language</Label>
          <Input
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            placeholder='English'
          />
        </div>
      </div>
      <Button type='submit' className='w-full' disabled={isPending}>
        {isPending ? (
          <Loader2 className='mr-1 h-4 w-4 animate-spin' />
        ) : (
          <Sparkles className='mr-1 h-4 w-4' />
        )}
        {isPending ? 'Writing your CV…' : 'Generate CV'}
      </Button>
    </form>
  )
}

export function CvBuilder({
  applicationId,
  jobRoleId,
}: {
  applicationId?: number
  jobRoleId?: number
}) {
  const qc = useQueryClient()
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [editing, setEditing] = useState(false)
  const [refining, setRefining] = useState<CvSection | null>(null)
  const [instruction, setInstruction] = useState('')
  const [progress, setProgress] = useState<BatchProgress | null>(null)
  const [deleting, setDeleting] = useState<CvDraftSummary | CvDraft | null>(
    null
  )

  const { data: candidatesResult, isLoading: candidateLoading } = useQuery({
    queryKey: ['candidates', 'me'],
    queryFn: () => candidatesApi.list({ pageSize: 1 }),
  })
  const candidate = candidatesResult?.items[0]

  // Pre-fill the form when opened from an application ("Tailor CV") or a vacancy.
  const { data: prefill, isLoading: prefillLoading } = useQuery({
    queryKey: ['cv-builder-prefill', applicationId, jobRoleId],
    queryFn: async () => {
      if (applicationId) {
        const app = await applicationsApi.get(applicationId)
        return {
          jobTitle: app.jobRoleTitle ?? '',
          jobDescription: jobPostingText(
            app.jobRoleDescription,
            app.jobRoleRequirements
          ),
        }
      }
      const role = await jobRolesApi.get(jobRoleId!)
      return {
        jobTitle: role.title,
        jobDescription: [
          role.description,
          role.requirements && `Requirements:\n${role.requirements}`,
        ]
          .filter(Boolean)
          .join('\n\n'),
      }
    },
    enabled: !!applicationId || !!jobRoleId,
  })

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['profile', candidate?.id],
    queryFn: () => profileApi.get(candidate!.id),
    enabled: !!candidate,
  })

  const { data: wishlist } = useQuery({
    queryKey: ['applications', 'wishlist', candidate?.id],
    queryFn: () =>
      applicationsApi.list({
        candidateId: candidate?.id,
        status: 'Wishlist',
        pageSize: 100,
      }),
    enabled: !!candidate,
  })

  const { data: draftsResult, isLoading: draftsLoading } = useQuery({
    queryKey: ['cv-drafts', candidate?.id],
    queryFn: () =>
      cvBuilderApi.list({ candidateId: candidate?.id, pageSize: 50 }),
    enabled: !!candidate,
  })

  const { data: draft, isLoading: draftLoading } = useQuery({
    queryKey: ['cv-draft', selectedId],
    queryFn: () => cvBuilderApi.get(selectedId!),
    enabled: selectedId !== null,
  })

  const applyDraft = (updated: CvDraft) => {
    qc.setQueryData(['cv-draft', updated.id], updated)
    qc.invalidateQueries({ queryKey: ['cv-drafts'] })
  }

  const generate = useMutation({
    mutationFn: (data: GenerateFormData) =>
      cvBuilderApi.generate({
        candidateId: candidate!.id,
        jobTitle: data.jobTitle,
        jobApplicationId: applicationId,
        jobDescription: data.jobDescription || undefined,
        instructions: data.instructions || undefined,
        backgroundText: data.backgroundText || undefined,
        tone: data.tone || undefined,
        language: data.language || undefined,
      }),
    onSuccess: (created) => {
      applyDraft(created)
      setSelectedId(created.id)
      setEditing(false)
      toast.success('CV generated')
    },
    onError: () => toast.error('Failed to generate CV'),
  })

  // Writes one CV per wishlist job that has a posting and no draft yet, one after another so a
  // slow or failing job does not hold up or break the others.
  const generateAll = useMutation({
    mutationFn: async () => {
      const existing = new Set(
        (draftsResult?.items ?? []).map((d) => d.jobApplicationId)
      )
      const todo = (wishlist?.items ?? []).filter(
        (a) => a.jobRoleDescription?.trim() && !existing.has(a.id)
      )
      const result: BatchProgress = { done: 0, total: todo.length, failed: 0 }
      setProgress({ ...result })

      for (const a of todo) {
        try {
          await cvBuilderApi.generate({
            candidateId: candidate!.id,
            jobTitle: a.jobRoleTitle ?? 'Job',
            title: a.companyName
              ? `${a.jobRoleTitle} - ${a.companyName}`
              : undefined,
            jobDescription: jobPostingText(
              a.jobRoleDescription,
              a.jobRoleRequirements
            ),
            jobApplicationId: a.id,
            backgroundText: loadBackground() || undefined,
          })
        } catch {
          result.failed++
        }
        result.done++
        setProgress({ ...result })
        qc.invalidateQueries({ queryKey: ['cv-drafts'] })
      }
      return result
    },
    onSuccess: (r) => {
      if (r.failed === 0) toast.success(`Wrote ${r.total} CVs`)
      else toast.warning(`Wrote ${r.total - r.failed} of ${r.total} CVs`)
    },
    onError: () => toast.error('Failed to write the CVs'),
  })

  const save = useMutation({
    mutationFn: (content: CvContent) =>
      cvBuilderApi.update(draft!.id, {
        title: draft!.title,
        templateId: draft!.templateId,
        content,
      }),
    onSuccess: (updated) => {
      applyDraft(updated)
      setEditing(false)
      toast.success('Changes saved')
    },
    onError: () => toast.error('Failed to save changes'),
  })

  const refine = useMutation({
    mutationFn: (section: CvSection) =>
      cvBuilderApi.regenerateSection(draft!.id, {
        section,
        instruction,
        backgroundText: loadBackground() || undefined,
      }),
    onSuccess: (updated) => {
      applyDraft(updated)
      setRefining(null)
      setInstruction('')
      toast.success('Section updated')
    },
    onError: () => toast.error('Failed to refine section'),
  })

  const exportPdf = useMutation({
    mutationFn: async () => {
      const result = await cvBuilderApi.exportPdf(draft!.id)
      const list = await cvsApi.list({
        candidateId: draft!.candidateId,
        pageSize: 1,
      })
      const cv = list.items.find((c) => c.id === result.cvId)
      await downloadCvFile({
        id: result.cvId,
        fileName: cv?.fileName ?? `${draft!.title}.pdf`,
      })
      return result
    },
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ['cvs'] })
      qc.invalidateQueries({ queryKey: ['applications'] })

      if (result.attachedApplicationId) {
        toast.success('PDF saved and attached to the application')
      } else if (result.existingCvKept && draft?.jobApplicationId) {
        // The application already has a CV; replacing it is the user's call.
        const applicationId = draft.jobApplicationId
        toast('PDF saved to your CVs', {
          description: 'The application already has a CV attached.',
          action: {
            label: 'Use this one instead',
            onClick: () =>
              applicationsApi
                .attachCv(applicationId, result.cvId)
                .then(() => {
                  qc.invalidateQueries({ queryKey: ['applications'] })
                  toast.success('CV replaced on the application')
                })
                .catch(() => toast.error('Failed to replace the CV')),
          },
        })
      } else {
        toast.success('PDF saved to your CVs')
      }
    },
    onError: () => toast.error('Failed to export PDF'),
  })

  const remove = useMutation({
    mutationFn: (id: number) => cvBuilderApi.delete(id),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ['cv-drafts'] })
      if (selectedId === id) setSelectedId(null)
      setDeleting(null)
      toast.success('Draft deleted')
    },
    onError: () => toast.error('Failed to delete draft'),
  })

  if (!candidateLoading && !candidate) {
    return (
      <div className='rounded-md border py-12 text-center text-muted-foreground'>
        No candidate profile found for your account yet.
      </div>
    )
  }

  const drafts = draftsResult?.items ?? []

  return (
    <div className='grid gap-6 lg:grid-cols-[360px_1fr]'>
      <div className='space-y-6'>
        <WishlistPanel
          applications={wishlist?.items ?? []}
          drafts={draftsResult?.items ?? []}
          isGenerating={generateAll.isPending}
          progress={progress}
          onSelectDraft={(id) => {
            setSelectedId(id)
            setEditing(false)
          }}
          onGenerateAll={() => generateAll.mutate()}
        />

        <div className='rounded-md border p-4'>
          <h2 className='mb-3 font-semibold'>New CV</h2>
          {prefillLoading || profileLoading ? (
            <Skeleton className='h-64 w-full' />
          ) : (
            <GenerateForm
              key={`${applicationId}-${jobRoleId}`}
              initial={prefill}
              profileRoles={profile?.experiences.length ?? 0}
              isPending={generate.isPending || !candidate}
              onSubmit={(d) => generate.mutate(d)}
            />
          )}
        </div>

        <div className='rounded-md border p-4'>
          <h2 className='mb-3 font-semibold'>Your drafts</h2>
          {draftsLoading && <Skeleton className='h-8 w-full' />}
          {!draftsLoading && drafts.length === 0 && (
            <p className='text-sm text-muted-foreground'>No drafts yet.</p>
          )}
          <ul className='space-y-1'>
            {drafts.map((d) => (
              <li key={d.id}>
                <button
                  type='button'
                  onClick={() => {
                    setSelectedId(d.id)
                    setEditing(false)
                  }}
                  className={`w-full rounded px-2 py-1.5 text-left text-sm hover:bg-muted ${
                    d.id === selectedId ? 'bg-muted font-medium' : ''
                  }`}
                >
                  <div className='truncate'>{d.title}</div>
                  <div className='text-xs text-muted-foreground'>
                    {format(new Date(d.lastModified), 'MMM d, yyyy')}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className='min-w-0'>
        {selectedId === null && (
          <div className='flex h-64 items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground'>
            Generate a CV or pick a draft to see it here.
          </div>
        )}
        {selectedId !== null && draftLoading && (
          <Skeleton className='h-96 w-full' />
        )}
        {draft && candidate && (
          <div className='space-y-3'>
            <div className='flex flex-wrap items-center justify-between gap-2'>
              <div>
                <h2 className='font-semibold'>{draft.title}</h2>
                <p className='text-xs text-muted-foreground'>
                  Hover a section and click Refine to rewrite it with AI.
                </p>
              </div>
              <div className='flex gap-2'>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => setEditing((v) => !v)}
                >
                  <Pencil className='mr-1 h-4 w-4' />{' '}
                  {editing ? 'Preview' : 'Edit'}
                </Button>
                <Button
                  size='sm'
                  onClick={() => exportPdf.mutate()}
                  disabled={exportPdf.isPending}
                >
                  {exportPdf.isPending ? (
                    <Loader2 className='mr-1 h-4 w-4 animate-spin' />
                  ) : (
                    <FileDown className='mr-1 h-4 w-4' />
                  )}
                  Export PDF
                </Button>
                <Button
                  variant='ghost'
                  size='icon'
                  className='h-8 w-8 text-destructive'
                  title='Delete draft'
                  onClick={() => setDeleting(draft)}
                >
                  <Trash2 className='h-4 w-4' />
                </Button>
              </div>
            </div>

            {editing ? (
              <div className='rounded-md border p-4'>
                <CvEditor
                  content={draft.content}
                  isSaving={save.isPending}
                  onSave={(c) => save.mutate(c)}
                  onCancel={() => setEditing(false)}
                />
              </div>
            ) : (
              <div className='rounded-md bg-muted/40 p-4'>
                <CvPreview
                  header={{
                    fullName: candidate.fullName,
                    email: candidate.email,
                    phone: candidate.phone,
                    location: candidate.currentLocation,
                  }}
                  content={draft.content}
                  onRefine={(section) => setRefining(section)}
                />
              </div>
            )}
          </div>
        )}
      </div>

      <Dialog
        open={refining !== null}
        onOpenChange={(open) => {
          if (!open) {
            setRefining(null)
            setInstruction('')
          }
        }}
      >
        <DialogContent className='max-w-lg'>
          <DialogHeader>
            <DialogTitle>
              Refine {refining ? SECTION_LABELS[refining] : ''}
            </DialogTitle>
          </DialogHeader>
          <Textarea
            rows={4}
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            placeholder='What should change? e.g. Make it shorter and focus on cloud work'
          />
          <DialogFooter>
            <Button variant='outline' onClick={() => setRefining(null)}>
              Cancel
            </Button>
            <Button
              disabled={!instruction.trim() || refine.isPending}
              onClick={() => refining && refine.mutate(refining)}
            >
              {refine.isPending && (
                <Loader2 className='mr-1 h-4 w-4 animate-spin' />
              )}
              Rewrite
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        title='Delete draft'
        desc={`Are you sure you want to delete "${deleting?.title}"? Exported PDFs in your CVs are kept.`}
        destructive
        confirmText='Delete'
        isLoading={remove.isPending}
        handleConfirm={() => deleting && remove.mutate(deleting.id)}
      />
    </div>
  )
}
