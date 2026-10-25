import { useMemo, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { authApi } from '@/features/auth/api'
import { candidatesApi } from '@/features/candidates/api'
import { useAuthStore } from '@/stores/auth-store'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { preferencesApi } from './api'
import { OptionTile } from './components/option-tile'
import { TagInput } from './components/tag-input'
import {
  MAX_SALARY,
  SALARY_STEP,
  currencies,
  employmentTypeOptions,
  goalOptions,
  industryOptions,
  questions,
  remoteRegionOptions,
  searchIntensityOptions,
  workAuthorizationOptions,
  workModeOptions,
  workStatusOptions,
  type Answers,
  type Option,
  type Question,
} from './data/questions'
import { useOnboardingAnswers } from './store'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const roleSuggestions = [
  'Software Engineer',
  'Technical Lead',
  'Product Manager',
  'Data Analyst',
  'Designer',
]

function toggle(list: string[], value: string) {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value]
}

function labelOf(options: Option[], values: string[]) {
  return values.map((v) => options.find((o) => o.value === v)?.label ?? v)
}

function formatSalary(value: number, currency: string) {
  const text = new Intl.NumberFormat('en-US').format(value)
  return value >= MAX_SALARY ? `${text}+ ${currency}` : `${text} ${currency}`
}

function SingleChoice({
  options,
  value,
  onChange,
}: {
  options: Option[]
  value?: string
  onChange: (value: string) => void
}) {
  return (
    <div role='radiogroup' className='grid gap-2.5'>
      {options.map((o) => (
        <OptionTile
          key={o.value}
          label={o.label}
          description={o.description}
          selected={value === o.value}
          onClick={() => onChange(o.value)}
        />
      ))}
    </div>
  )
}

function MultiChoice({
  options,
  values,
  onChange,
  exclusive,
  columns,
}: {
  options: Option[]
  values: string[]
  onChange: (values: string[]) => void
  /** A value that clears all others when picked (e.g. "any industry"). */
  exclusive?: string
  columns?: boolean
}) {
  function pick(value: string) {
    if (exclusive && value === exclusive) {
      onChange(values.includes(value) ? [] : [value])
      return
    }
    onChange(toggle(values.filter((v) => v !== exclusive), value))
  }

  return (
    <div className={cn('grid gap-2.5', columns && 'sm:grid-cols-3')}>
      {options.map((o) => (
        <OptionTile
          key={o.value}
          multiple
          label={o.label}
          description={o.description}
          selected={values.includes(o.value)}
          onClick={() => pick(o.value)}
        />
      ))}
    </div>
  )
}

function QuestionBody({
  question,
  answers,
  set,
}: {
  question: Question
  answers: Answers
  set: <K extends keyof Answers>(key: K, value: Answers[K]) => void
}) {
  switch (question.id) {
    case 'workStatus':
      return <SingleChoice options={workStatusOptions} value={answers.workStatus} onChange={(v) => set('workStatus', v)} />
    case 'searchIntensity':
      return <SingleChoice options={searchIntensityOptions} value={answers.searchIntensity} onChange={(v) => set('searchIntensity', v)} />
    case 'primaryGoal':
      return <SingleChoice options={goalOptions} value={answers.primaryGoal} onChange={(v) => set('primaryGoal', v)} />
    case 'targetRoles':
      return (
        <TagInput
          values={answers.targetRoles}
          onChange={(v) => set('targetRoles', v)}
          placeholder='e.g. Technical Lead'
          suggestions={roleSuggestions}
        />
      )
    case 'minSalary':
      return (
        <div className='space-y-5 rounded-lg border bg-card p-5'>
          <div className='flex items-center justify-between gap-3'>
            <span className='text-2xl font-bold tracking-tight'>
              {formatSalary(answers.minSalary, answers.salaryCurrency)}
            </span>
            <Select value={answers.salaryCurrency} onValueChange={(v) => set('salaryCurrency', v)}>
              <SelectTrigger aria-label='Currency' className='h-9 w-auto'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {currencies.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <input
            type='range'
            aria-label='Minimum salary'
            min={0}
            max={MAX_SALARY}
            step={SALARY_STEP}
            value={answers.minSalary}
            onChange={(e) => set('minSalary', Number(e.target.value))}
            className='w-full accent-primary'
          />
          <div className='flex justify-between text-xs text-muted-foreground'>
            <span>0</span>
            <span>{new Intl.NumberFormat('en-US').format(MAX_SALARY)}+</span>
          </div>
        </div>
      )
    case 'employmentTypes':
      return <MultiChoice columns options={employmentTypeOptions} values={answers.employmentTypes} onChange={(v) => set('employmentTypes', v)} />
    case 'workModes':
      return <MultiChoice columns options={workModeOptions} values={answers.workModes} onChange={(v) => set('workModes', v)} />
    case 'willingToRelocate':
      return (
        <SingleChoice
          options={[
            { value: 'yes', label: 'Yes' },
            { value: 'no', label: 'No' },
          ]}
          value={answers.willingToRelocate === undefined ? undefined : answers.willingToRelocate ? 'yes' : 'no'}
          onChange={(v) => set('willingToRelocate', v === 'yes')}
        />
      )
    case 'remoteRegions':
      return <MultiChoice exclusive='anywhere' options={remoteRegionOptions} values={answers.remoteRegions} onChange={(v) => set('remoteRegions', v)} />
    case 'commuteCities':
      return <TagInput values={answers.commuteCities} onChange={(v) => set('commuteCities', v)} placeholder='Type a city name…' />
    case 'workAuthorization':
      return <SingleChoice options={workAuthorizationOptions} value={answers.workAuthorization} onChange={(v) => set('workAuthorization', v)} />
    case 'industries':
      return <MultiChoice exclusive='any' options={industryOptions} values={answers.industries} onChange={(v) => set('industries', v)} />
  }
}

export function OnboardingQuestions() {
  const navigate = useNavigate()
  const { auth } = useAuthStore()
  const { answers, setAnswer, reset } = useOnboardingAnswers()
  const [index, setIndex] = useState(0)
  const [isSaving, setIsSaving] = useState(false)

  // Questions that apply to the current answers (remote / commute are conditional).
  const visible = useMemo(
    () => questions.filter((q) => !q.when || q.when(answers)),
    [answers]
  )
  const step = Math.min(index, visible.length - 1)
  const question = visible[step]
  const isLast = step === visible.length - 1
  const canContinue = question.isValid(answers)

  async function finish() {
    setIsSaving(true)
    try {
      const { items } = await candidatesApi.mine()
      const me = items[0]
      const candidateId = me.id
      const countries = [
        ...labelOf(remoteRegionOptions, answers.remoteRegions),
        ...answers.commuteCities,
      ]
      await preferencesApi.save(candidateId, answers)
      await authApi.updateOnboardingStatus('Completed')
      auth.setOnboardingStatus('Completed')

      // Keep the candidate's summary fields in sync. The answers are already saved above, so a
      // failure here must not block finishing. The update endpoint replaces every field and
      // requires name and email, so the existing values are resent.
      try {
        await candidatesApi.update(candidateId, {
          fullName: me.fullName,
          email: me.email,
          phone: me.phone,
          currentLocation: me.currentLocation,
          notes: me.notes,
          targetRoles: answers.targetRoles.join(', ') || undefined,
          targetCountries: countries.join(', ') || undefined,
          preferredWorkType: answers.workModes.join(', ') || undefined,
        })
      } catch {
        toast.warning('Your answers are saved, but your profile summary could not be updated.')
      }
      reset()
      navigate({ to: '/', replace: true })
    } catch {
      toast.error('Failed to save your preferences. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  async function skip() {
    try {
      await authApi.updateOnboardingStatus('Skipped')
      auth.setOnboardingStatus('Skipped')
      navigate({ to: '/', replace: true })
    } catch {
      toast.error('Failed to skip onboarding. Please try again.')
    }
  }

  function next() {
    if (!canContinue) return
    if (isLast) void finish()
    else setIndex(step + 1)
  }

  return (
    <main className='flex min-h-svh flex-col items-center justify-center bg-muted/40 px-4 py-10'>
      <Card className='w-full max-w-xl gap-0 overflow-hidden rounded-3xl border-border/80 shadow-lg'>
        <CardHeader className='gap-4 border-b px-8 py-6'>
          <div className='flex items-center justify-between'>
            <button
              type='button'
              onClick={() => (step === 0 ? void skip() : setIndex(step - 1))}
              className='inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground'
            >
              <ArrowLeft className='size-4 rtl:rotate-180' />
              {step === 0 ? 'Skip for now' : 'Back'}
            </button>
            <span className='text-sm font-medium text-muted-foreground'>
              {step + 1} / {visible.length}
            </span>
          </div>
          <div className='flex gap-1.5' aria-hidden>
            {visible.map((q, i) => (
              <span
                key={q.id}
                className={cn('h-1 flex-1 rounded-full bg-muted', i <= step && 'bg-primary')}
              />
            ))}
          </div>
          <CardTitle className='text-2xl font-bold tracking-tight'>{question.title}</CardTitle>
          {question.subtitle && (
            <CardDescription className='text-base'>{question.subtitle}</CardDescription>
          )}
        </CardHeader>

        <CardContent className='space-y-6 px-8 py-7'>
          <QuestionBody question={question} answers={answers} set={setAnswer} />
          <Button
            size='lg'
            className='w-full rounded-2xl'
            disabled={!canContinue || isSaving}
            onClick={next}
          >
            {isLast ? (isSaving ? 'Saving…' : 'Finish') : 'Continue'}
            <ArrowRight className='size-4 rtl:rotate-180' />
          </Button>
        </CardContent>
      </Card>

      <p className='mt-6 text-sm text-muted-foreground'>
        You can change these anytime in your preferences.
      </p>
    </main>
  )
}
