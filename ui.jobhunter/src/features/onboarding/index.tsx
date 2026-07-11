import { useRef, useState, type ChangeEvent, type DragEvent } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { ArrowRight, CheckCircle2, FileText, Upload, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

const MAX_FILE_SIZE = 10 * 1024 * 1024
const ACCEPTED_EXTENSIONS = ['pdf', 'doc', 'docx', 'md']

function formatFileSize(size: number) {
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`
  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

function validateResumeFile(file: File) {
  const extension = file.name.split('.').pop()?.toLowerCase()

  if (!extension || !ACCEPTED_EXTENSIONS.includes(extension)) {
    return 'Upload a PDF, DOC, DOCX, or MD resume file.'
  }

  if (file.size > MAX_FILE_SIZE) {
    return 'File must be 10 MB or smaller.'
  }

  return null
}

export function Onboarding() {
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)

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

  function continueToDashboard() {
    if (!selectedFile) return
    navigate({ to: '/', replace: true })
  }

  return (
    <main className='flex min-h-svh flex-col items-center justify-center bg-muted/40 px-4 py-10'>
      <Card className='w-full max-w-xl gap-0 overflow-hidden rounded-3xl border-border/80 shadow-lg'>
        <CardHeader className='border-b px-8 py-7'>
          <div className='mb-4 flex items-center gap-2 text-sm font-bold tracking-wide text-violet-500 uppercase'>
            <span className='size-2 rounded-full bg-violet-500' />
            Step 1 of 3
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
                ? 'border-violet-500 bg-violet-100/70 dark:border-violet-500 dark:bg-violet-950/40'
                : 'border-violet-200 bg-violet-50/40 hover:border-violet-400 hover:bg-violet-50 dark:border-violet-900 dark:bg-violet-950/20 dark:hover:border-violet-600'
            }`}
          >
            <input
              ref={inputRef}
              id='cv-upload'
              type='file'
              accept='.pdf,.doc,.docx,.md,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/markdown'
              className='sr-only'
              onChange={handleFileChange}
            />
            {selectedFile ? (
              <div className='w-full max-w-sm rounded-3xl border bg-background p-5 text-start shadow-sm'>
                <div className='flex items-start gap-3'>
                  <div className='flex size-12 shrink-0 items-center justify-center rounded-2xl bg-violet-100 text-violet-600 dark:bg-violet-950'>
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
                <div className='mb-5 flex size-18 items-center justify-center rounded-3xl border border-violet-200 bg-violet-100 text-violet-600 shadow-sm dark:border-violet-800 dark:bg-violet-950'>
                  <Upload className='size-8' />
                </div>
                <p className='text-lg font-bold'>Drop your CV here</p>
                <p className='mt-1 text-sm text-muted-foreground'>
                  PDF, DOC, DOCX or MD - up to 10 MB
                </p>
                <span className='mt-5 inline-flex h-10 items-center justify-center rounded-md bg-violet-600 px-8 text-sm font-medium text-white shadow-xs hover:bg-violet-700'>
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

          <Button variant='outline' size='lg' className='w-full rounded-2xl'>
            Fill in manually
          </Button>

          <Button
            size='lg'
            className='w-full rounded-2xl'
            disabled={!selectedFile}
            onClick={continueToDashboard}
          >
            Continue to dashboard
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
