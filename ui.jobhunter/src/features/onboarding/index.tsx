import {
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type FormEvent,
} from 'react'
import { useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  CheckCircle2,
  FileText,
  Mail,
  MapPin,
  Phone,
  Sparkles,
  Upload,
  UserRound,
  X,
} from 'lucide-react'
import { candidatesApi, type Candidate } from '@/features/candidates/api'
import { cvsApi } from '@/features/cvs/api'
import { profileApi, type ParsedProfile } from '@/features/profile/api'
import { ImportProgress } from '@/features/profile/components/import-progress'
import { useAuthStore } from '@/stores/auth-store'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

const MAX_FILE_SIZE = 10 * 1024 * 1024
// The backend CV reader (and AI import) supports PDF and DOCX only.
const ACCEPTED_EXTENSIONS = ['pdf', 'docx']

function formatFileSize(size: number) {
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`
  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

function validateResumeFile(file: File) {
  const extension = file.name.split('.').pop()?.toLowerCase()

  if (!extension || !ACCEPTED_EXTENSIONS.includes(extension)) {
    return 'Upload a PDF or DOCX resume file.'
  }

  if (file.size > MAX_FILE_SIZE) {
    return 'File must be 10 MB or smaller.'
  }

  return null
}

function SkipOnboardingButton({
  onSkip,
  isSkipping,
}: {
  onSkip: () => void
  isSkipping: boolean
}) {
  return (
    <button
      type='button'
      onClick={onSkip}
      disabled={isSkipping}
      className='inline-flex w-fit items-center text-sm font-medium text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50'
    >
      {isSkipping ? 'Skipping…' : 'Skip for now'}
    </button>
  )
}

function nameFromResume(fileName: string) {
  const name = fileName
    .replace(/\.[^.]+$/, '')
    .replace(/[-_]+/g, ' ')
    .replace(/\b(cv|resume)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim()

  return name.replace(/\b\w/g, (letter) => letter.toUpperCase())
}

export function Onboarding() {
  const navigate = useNavigate()
  const { auth } = useAuthStore()
  const inputRef = useRef<HTMLInputElement>(null)
  const [view, setView] = useState<'upload' | 'manual' | 'review'>('upload')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [parsed, setParsed] = useState<ParsedProfile | null>(null)
  const [cvId, setCvId] = useState<number | null>(null)
  const [candidate, setCandidate] = useState<Candidate | null>(null)
  const isSkipping = false

  function handleFile(file?: File) {
    if (!file) return

    const validationError = validateResumeFile(file)
    if (validationError) {
      setSelectedFile(null)
      setError(validationError)
      return
    }

    setSelectedFile(file)
    setError(null)
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    handleFile(event.target.files?.[0])
  }

  function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault()
    setIsDragging(false)
    handleFile(event.dataTransfer.files[0])
  }

  function removeFile() {
    setSelectedFile(null)
    setError(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  // Uploads the CV and lets the AI read it, then shows the result for review.
  async function analyzeResume() {
    if (!selectedFile) return
    setIsAnalyzing(true)
    try {
      const { items } = await candidatesApi.mine()
      const me = items[0]
      const id = await cvsApi.upload({ candidateId: me.id, file: selectedFile })
      const result = await profileApi.previewImport(id)
      setCandidate(me)
      setCvId(id)
      setParsed(result)
      setView('review')
    } catch {
      toast.error(
        'Could not read this CV. Use a text-based PDF or DOCX and try again.'
      )
    } finally {
      setIsAnalyzing(false)
    }
  }

  async function submitManualProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const fullName = String(data.get('fullName') ?? '').trim()
    const email = String(data.get('email') ?? auth.user?.email ?? '').trim()
    const jobTitle = String(data.get('jobTitle') ?? '').trim()
    const location = String(data.get('location') ?? '').trim()
    const phone = String(data.get('phone') ?? '').trim()
    const skills = String(data.get('skills') ?? '').trim()
    const summary = String(data.get('summary') ?? '').trim()

    setIsSubmitting(true)
    try {
      const { items } = await candidatesApi.mine()
      const candidateId = items[0].id
      await candidatesApi.update(candidateId, {
        fullName,
        email,
        phone: phone || undefined,
        currentLocation: location || undefined,
        targetRoles: jobTitle || undefined,
        // Without an analyzed CV the typed summary and skills are kept as notes.
        notes: parsed
          ? undefined
          : [summary, skills].filter(Boolean).join('\n\n') || undefined,
      })
      if (parsed) {
        await profileApi.importProfile({
          candidateId,
          cvId: cvId ?? undefined,
          mode: 'Merge',
          headline: jobTitle || null,
          summary: summary || null,
          experiences: parsed.experiences
            .filter((e) => e.title && e.company && e.startDate)
            .map((e) => ({
              title: e.title,
              employmentType: e.employmentType ?? null,
              company: e.company,
              isCurrent: e.isCurrent,
              startDate: e.startDate!,
              endDate: e.isCurrent ? null : (e.endDate ?? null),
              location: e.location ?? null,
              workplaceType: e.workplaceType ?? null,
              description: e.description ?? null,
              skills: e.skills,
            })),
          educations: parsed.educations.map((e) => ({
            institution: e.institution,
            degree: e.degree,
            fieldOfStudy: e.fieldOfStudy ?? null,
            location: e.location ?? null,
            startDate: e.startDate ?? null,
            endDate: e.endDate ?? null,
            details: e.details ?? null,
          })),
          skills: parsed.skills,
          projects: parsed.projects,
          certifications: parsed.certifications,
          languages: parsed.languages.map((l) => ({
            name: l.name,
            proficiency: l.proficiency ?? 'ProfessionalWorking',
          })),
          links: parsed.links,
        })
      }
      navigate({ to: '/onboarding/questions', replace: true })
    } catch {
      toast.error('Failed to save your profile. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Skipping the CV step still continues to the questions; onboarding completes after those.
  function skipOnboarding() {
    navigate({ to: '/onboarding/questions', replace: true })
  }

  if (view === 'review' && selectedFile) {
    const initialName = candidate?.fullName || nameFromResume(selectedFile.name)
    const initialEmail = candidate?.email || auth.user?.email || ''
    const initialTitle = parsed?.headline || parsed?.experiences[0]?.title || ''
    const initialPhone = candidate?.phone || parsed?.phone || ''
    const initialLocation =
      candidate?.currentLocation ||
      [parsed?.city, parsed?.country].filter(Boolean).join(', ')
    const initialSkills = (parsed?.skills ?? []).map((k) => k.name).join(', ')

    return (
      <main className='flex min-h-svh flex-col items-center justify-center bg-muted/40 px-4 py-10'>
        <Card className='w-full max-w-2xl gap-0 overflow-hidden rounded-3xl border-border/80 shadow-lg'>
          <CardHeader className='border-b px-8 py-7'>
            <div className='mb-5 flex items-center justify-between'>
              <button
                type='button'
                onClick={() => setView('upload')}
                className='inline-flex w-fit items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground'
              >
                <ArrowLeft className='size-4' />
                Back to CV upload
              </button>
              <SkipOnboardingButton onSkip={skipOnboarding} isSkipping={isSkipping} />
            </div>
            <div className='mb-4 flex items-center gap-2 text-sm font-bold tracking-wide text-primary uppercase'>
              <span className='size-2 rounded-full bg-primary' />
              Step 2 of 3
            </div>
            <CardTitle className='text-3xl font-bold tracking-tight'>
              Review your profile
            </CardTitle>
            <CardDescription className='text-base'>
              We filled this in from your resume. Check the details before you
              continue.
            </CardDescription>
          </CardHeader>

          <CardContent className='px-8 py-7'>
            <div className='mb-6 flex items-center gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4'>
              <div className='flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'>
                <CheckCircle2 className='size-5' />
              </div>
              <div className='min-w-0 flex-1'>
                <p className='font-semibold'>Resume processed successfully</p>
                <p className='truncate text-sm text-muted-foreground'>
                  {selectedFile.name}
                </p>
              </div>
            </div>

            <form className='space-y-6' onSubmit={submitManualProfile}>
              <div className='grid gap-5 sm:grid-cols-2'>
                <div className='space-y-2'>
                  <Label htmlFor='parsed-full-name'>Full name</Label>
                  <div className='relative'>
                    <UserRound className='pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground' />
                    <Input
                      id='parsed-full-name'
                      name='fullName'
                      defaultValue={initialName}
                      className='h-11 rounded-xl pl-10'
                      required
                    />
                  </div>
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='parsed-email'>Email</Label>
                  <div className='relative'>
                    <Mail className='pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground' />
                    <Input
                      id='parsed-email'
                      name='email'
                      type='email'
                      defaultValue={initialEmail}
                      className='h-11 rounded-xl pl-10'
                      required
                    />
                  </div>
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='parsed-job-title'>Current job title</Label>
                  <div className='relative'>
                    <BriefcaseBusiness className='pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground' />
                    <Input
                      id='parsed-job-title'
                      name='jobTitle'
                      defaultValue={initialTitle}
                      className='h-11 rounded-xl pl-10'
                      required
                    />
                  </div>
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='parsed-phone'>Phone</Label>
                  <div className='relative'>
                    <Phone className='pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground' />
                    <Input
                      id='parsed-phone'
                      name='phone'
                      type='tel'
                      defaultValue={initialPhone}
                      className='h-11 rounded-xl pl-10'
                    />
                  </div>
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='parsed-location'>Location</Label>
                  <div className='relative'>
                    <MapPin className='pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground' />
                    <Input
                      id='parsed-location'
                      name='location'
                      defaultValue={initialLocation}
                      placeholder='City, country'
                      className='h-11 rounded-xl pl-10'
                    />
                  </div>
                </div>
              </div>

              <div className='space-y-2'>
                <Label htmlFor='parsed-summary'>Professional summary</Label>
                <Textarea
                  id='parsed-summary'
                  name='summary'
                  defaultValue={parsed?.summary ?? ''}
                  className='min-h-24 resize-none rounded-xl'
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='parsed-skills'>Skills</Label>
                <div className='relative'>
                  <Sparkles className='pointer-events-none absolute top-3 left-3 size-4 text-muted-foreground' />
                  <Textarea
                    id='parsed-skills'
                    name='skills'
                    defaultValue={initialSkills}
                    className='min-h-20 resize-none rounded-xl pl-10'
                  />
                </div>
              </div>

              <Button
                size='lg'
                className='w-full rounded-2xl'
                type='submit'
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Saving…' : 'Confirm and continue'}
                <ArrowRight className='size-4' />
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className='mt-6 text-sm text-muted-foreground'>
          You can edit any information extracted from your resume.
        </p>
      </main>
    )
  }

  if (view === 'manual') {
    return (
      <main className='flex min-h-svh flex-col items-center justify-center bg-muted/40 px-4 py-10'>
        <Card className='w-full max-w-xl gap-0 overflow-hidden rounded-3xl border-border/80 shadow-lg'>
          <CardHeader className='border-b px-8 py-7'>
            <div className='mb-5 flex items-center justify-between'>
              <button
                type='button'
                onClick={() => setView('upload')}
                className='inline-flex w-fit items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground'
              >
                <ArrowLeft className='size-4' />
                Back to CV upload
              </button>
              <SkipOnboardingButton onSkip={skipOnboarding} isSkipping={isSkipping} />
            </div>
            <div className='mb-4 flex items-center gap-2 text-sm font-bold tracking-wide text-primary uppercase'>
              <span className='size-2 rounded-full bg-primary' />
              Step 1 of 3
            </div>
            <CardTitle className='text-3xl font-bold tracking-tight'>
              Build your profile
            </CardTitle>
            <CardDescription className='text-base'>
              Tell us what you are looking for and we’ll personalize your job
              search.
            </CardDescription>
          </CardHeader>

          <CardContent className='px-8 py-7'>
            <form className='space-y-5' onSubmit={submitManualProfile}>
              <div className='space-y-2'>
                <Label htmlFor='full-name'>Full name</Label>
                <div className='relative'>
                  <UserRound className='pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground' />
                  <Input
                    id='full-name'
                    name='fullName'
                    placeholder='Your full name'
                    className='h-11 rounded-xl pl-10'
                    required
                    autoFocus
                  />
                </div>
              </div>

              <div className='space-y-2'>
                <Label htmlFor='job-title'>Desired job title</Label>
                <div className='relative'>
                  <BriefcaseBusiness className='pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground' />
                  <Input
                    id='job-title'
                    name='jobTitle'
                    placeholder='e.g. Product Designer'
                    className='h-11 rounded-xl pl-10'
                    required
                  />
                </div>
              </div>

              <div className='space-y-2'>
                <Label htmlFor='location'>Location</Label>
                <div className='relative'>
                  <MapPin className='pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground' />
                  <Input
                    id='location'
                    name='location'
                    placeholder='City, country or Remote'
                    className='h-11 rounded-xl pl-10'
                    required
                  />
                </div>
              </div>

              <div className='space-y-2'>
                <Label htmlFor='skills'>Skills</Label>
                <div className='relative'>
                  <Sparkles className='pointer-events-none absolute top-3 left-3 size-4 text-muted-foreground' />
                  <Textarea
                    id='skills'
                    name='skills'
                    placeholder='Add your key skills, separated by commas'
                    className='min-h-24 resize-none rounded-xl pl-10'
                    required
                  />
                </div>
              </div>

              <Button
                size='lg'
                className='w-full rounded-2xl'
                type='submit'
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Saving…' : 'Save and continue'}
                <ArrowRight className='size-4' />
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className='mt-6 text-sm text-muted-foreground'>
          You can update your profile anytime.
        </p>
      </main>
    )
  }

  if (isAnalyzing) {
    return (
      <main className='flex min-h-svh flex-col items-center justify-center bg-muted/40 px-4 py-10'>
        <Card className='w-full max-w-xl gap-0 overflow-hidden rounded-3xl border-border/80 shadow-lg'>
          <CardContent className='px-8 py-10'>
            <ImportProgress fileName={selectedFile?.name} />
          </CardContent>
        </Card>
      </main>
    )
  }

  return (
    <main className='flex min-h-svh flex-col items-center justify-center bg-muted/40 px-4 py-10'>
      <Card className='w-full max-w-xl gap-0 overflow-hidden rounded-3xl border-border/80 shadow-lg'>
        <CardHeader className='border-b px-8 py-7'>
          <div className='mb-4 flex items-center justify-between'>
            <div className='flex items-center gap-2 text-sm font-bold tracking-wide text-primary uppercase'>
              <span className='size-2 rounded-full bg-primary' />
              Step 1 of 3
            </div>
            <SkipOnboardingButton onSkip={skipOnboarding} isSkipping={isSkipping} />
          </div>
          <CardTitle className='text-3xl font-bold tracking-tight'>
            Set up your profile
          </CardTitle>
          <CardDescription className='text-base'>
            Upload your CV and we'll do the rest.
          </CardDescription>
        </CardHeader>

        <CardContent className='space-y-6 px-8 py-7'>
          <label
            htmlFor='cv-upload'
            onDragOver={(event) => {
              event.preventDefault()
              setIsDragging(true)
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`flex min-h-72 cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed px-6 text-center transition-colors ${
              isDragging
                ? 'border-primary bg-accent/70 dark:border-primary dark:bg-primary/40'
                : 'border-primary/20 bg-accent/40 hover:border-primary hover:bg-accent dark:border-primary/30 dark:bg-primary/20 dark:hover:border-primary'
            }`}
          >
            <input
              ref={inputRef}
              id='cv-upload'
              type='file'
              accept='.pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document'
              className='sr-only'
              onChange={handleFileChange}
            />
            {selectedFile ? (
              <div className='w-full max-w-sm rounded-3xl border bg-background p-5 text-start shadow-sm'>
                <div className='flex items-start gap-3'>
                  <div className='flex size-12 shrink-0 items-center justify-center rounded-2xl bg-accent text-primary dark:bg-primary/15'>
                    <FileText className='size-6' />
                  </div>
                  <div className='min-w-0 flex-1'>
                    <p className='truncate font-bold'>{selectedFile.name}</p>
                    <p className='mt-1 text-sm text-muted-foreground'>
                      {formatFileSize(selectedFile.size)} selected
                    </p>
                  </div>
                  <button
                    type='button'
                    onClick={(event) => {
                      event.preventDefault()
                      removeFile()
                    }}
                    className='rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground'
                    aria-label='Remove selected CV'
                  >
                    <X className='size-4' />
                  </button>
                </div>
                <div className='mt-4 flex items-center gap-2 text-sm font-medium text-emerald-600 dark:text-emerald-400'>
                  <CheckCircle2 className='size-4' />
                  Resume ready to upload
                </div>
              </div>
            ) : (
              <>
                <div className='mb-5 flex size-18 items-center justify-center rounded-3xl border border-primary/20 bg-accent text-primary shadow-sm dark:border-primary/40 dark:bg-primary/15'>
                  <Upload className='size-8' />
                </div>
                <p className='text-lg font-bold'>Drop your CV here</p>
                <p className='mt-1 text-sm text-muted-foreground'>
                  PDF or DOCX - up to 10 MB
                </p>
                <span className='mt-5 inline-flex h-10 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-white shadow-xs hover:bg-primary/90'>
                  Upload CV
                </span>
              </>
            )}
          </label>

          {error && (
            <p className='-mt-3 text-center text-sm font-medium text-destructive'>
              {error}
            </p>
          )}

          <div className='flex items-center gap-4 text-sm text-muted-foreground'>
            <div className='h-px flex-1 bg-border' />
            or
            <div className='h-px flex-1 bg-border' />
          </div>

          <Button
            variant='outline'
            size='lg'
            className='w-full rounded-2xl'
            onClick={() => setView('manual')}
          >
            Fill in manually
          </Button>

          <Button
            size='lg'
            className='w-full rounded-2xl'
            disabled={!selectedFile}
            onClick={analyzeResume}
          >
            Continue
            <ArrowRight className='size-4' />
          </Button>
        </CardContent>
      </Card>

      <p className='mt-6 text-sm text-muted-foreground'>
        You can update your profile anytime.
      </p>
    </main>
  )
}
