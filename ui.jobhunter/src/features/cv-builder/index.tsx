import { useState } from 'react'
import { format } from 'date-fns'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
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
import { candidatesApi } from '@/features/candidates/api'
import { cvsApi } from '@/features/cvs/api'
import { downloadCvFile } from '@/features/cvs/lib/cv-file'
import {
  cvBuilderApi,
  type CvContent,
  type CvDraft,
  type CvDraftSummary,
  type CvSection,
} from './api'
import { CvEditor } from './components/cv-editor'
import { CvPreview } from './components/cv-preview'

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
  onSubmit,
}: {
  isPending: boolean
  onSubmit: (data: GenerateFormData) => void
}) {
  const [jobTitle, setJobTitle] = useState('')
  const [jobDescription, setJobDescription] = useState('')
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
      <div className='space-y-1'>
        <Label>About you (experience, education, skills) *</Label>
        <Textarea
          required
          rows={8}
          value={backgroundText}
          onChange={(e) => setBackgroundText(e.target.value)}
          placeholder='Paste your current CV text. The AI only uses facts from here. Saved in this browser.'
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

export function CvBuilder() {
  const qc = useQueryClient()
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [editing, setEditing] = useState(false)
  const [refining, setRefining] = useState<CvSection | null>(null)
  const [instruction, setInstruction] = useState('')
  const [deleting, setDeleting] = useState<CvDraftSummary | CvDraft | null>(
    null
  )

  const { data: candidatesResult, isLoading: candidateLoading } = useQuery({
    queryKey: ['candidates', 'me'],
    queryFn: () => candidatesApi.list({ pageSize: 1 }),
  })
  const candidate = candidatesResult?.items[0]

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
      const cvId = await cvBuilderApi.exportPdf(draft!.id)
      const list = await cvsApi.list({
        candidateId: draft!.candidateId,
        pageSize: 1,
      })
      const cv = list.items.find((c) => c.id === cvId)
      await downloadCvFile({
        id: cvId,
        fileName: cv?.fileName ?? `${draft!.title}.pdf`,
      })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cvs'] })
      toast.success('PDF saved to your CVs')
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
        <div className='rounded-md border p-4'>
          <h2 className='mb-3 font-semibold'>New CV</h2>
          <GenerateForm
            isPending={generate.isPending || !candidate}
            onSubmit={(d) => generate.mutate(d)}
          />
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
