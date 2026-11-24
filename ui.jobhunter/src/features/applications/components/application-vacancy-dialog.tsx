import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { jobRolesApi, type JobRole } from '@/features/job-roles/api'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { CURRENCIES } from '../data/constants'

const SOURCES = ['LinkedIn', 'Referral', 'CompanyWebsite', 'Recruiter', 'JobBoard', 'Other']
const WORK_TYPES = ['Remote', 'OnSite', 'Hybrid']
const EMPLOYMENT_TYPES = ['FullTime', 'PartTime', 'Contract', 'Internship', 'Temporary']

function splitWords(value: string) {
  return value.replace(/([A-Z])/g, ' $1').trim()
}

interface ApplicationVacancyDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  jobRole: JobRole
}

export function ApplicationVacancyDialog({ open, onOpenChange, jobRole }: ApplicationVacancyDialogProps) {
  const qc = useQueryClient()
  const { t } = useTranslation()

  const [title, setTitle] = useState(jobRole.title)
  const [jobLink, setJobLink] = useState(jobRole.jobLink ?? '')
  const [source, setSource] = useState(jobRole.source)
  const [workType, setWorkType] = useState(jobRole.workType)
  const [employmentType, setEmploymentType] = useState(jobRole.employmentType)
  const [salaryMin, setSalaryMin] = useState(jobRole.salaryMin?.toString() ?? '')
  const [salaryMax, setSalaryMax] = useState(jobRole.salaryMax?.toString() ?? '')
  const [currency, setCurrency] = useState(jobRole.currency ?? 'USD')
  const [description, setDescription] = useState(jobRole.description ?? '')
  const [requirements, setRequirements] = useState(jobRole.requirements ?? '')

  const save = useMutation({
    mutationFn: async () => {
      const trimmedTitle = title.trim()
      if (!trimmedTitle) throw new Error('missing-title')
      await jobRolesApi.update(jobRole.id, {
        companyId: jobRole.companyId,
        jobTitleId: jobRole.jobTitleId,
        title: trimmedTitle,
        jobLink: jobLink.trim() || undefined,
        source,
        country: jobRole.country,
        city: jobRole.city,
        workType,
        salaryMin: salaryMin ? Number(salaryMin) : undefined,
        salaryMax: salaryMax ? Number(salaryMax) : undefined,
        currency,
        employmentType,
        roleStatus: jobRole.roleStatus,
        description: description.trim() || undefined,
        requirements: requirements.trim() || undefined,
      })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['job-roles', 'detail', jobRole.id] })
      qc.invalidateQueries({ queryKey: ['applications'] })
      toast.success(t('Vacancy updated'))
      onOpenChange(false)
    },
    onError: (err) => {
      toast.error(err instanceof Error && err.message === 'missing-title' ? t('Title is required') : t('Failed to update vacancy'))
    },
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-h-[85vh] max-w-2xl overflow-y-auto rounded-2xl sm:max-w-2xl'>
        <DialogHeader>
          <DialogTitle>{t('Edit vacancy')}</DialogTitle>
          <DialogDescription>{t('Update the role details for this vacancy.')}</DialogDescription>
        </DialogHeader>

        <div className='space-y-4'>
          <div className='space-y-1'>
            <Label>{t('Title *')}</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} className='rounded-xl' />
          </div>

          <div className='space-y-1'>
            <Label>{t('Job link')}</Label>
            <Input value={jobLink} onChange={(e) => setJobLink(e.target.value)} placeholder='https://' className='rounded-xl' />
          </div>

          <div className='grid grid-cols-3 gap-3'>
            <div className='space-y-1'>
              <Label>{t('Source')}</Label>
              <Select value={source} onValueChange={setSource}>
                <SelectTrigger className='w-full rounded-xl'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SOURCES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {t(splitWords(s))}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className='space-y-1'>
              <Label>{t('Work type')}</Label>
              <Select value={workType} onValueChange={setWorkType}>
                <SelectTrigger className='w-full rounded-xl'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {WORK_TYPES.map((w) => (
                    <SelectItem key={w} value={w}>
                      {t(splitWords(w))}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className='space-y-1'>
              <Label>{t('Employment type')}</Label>
              <Select value={employmentType} onValueChange={setEmploymentType}>
                <SelectTrigger className='w-full rounded-xl'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EMPLOYMENT_TYPES.map((e) => (
                    <SelectItem key={e} value={e}>
                      {t(splitWords(e))}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className='grid grid-cols-3 gap-3'>
            <div className='space-y-1'>
              <Label>{t('Salary min')}</Label>
              <Input type='number' value={salaryMin} onChange={(e) => setSalaryMin(e.target.value)} className='rounded-xl' />
            </div>
            <div className='space-y-1'>
              <Label>{t('Salary max')}</Label>
              <Input type='number' value={salaryMax} onChange={(e) => setSalaryMax(e.target.value)} className='rounded-xl' />
            </div>
            <div className='space-y-1'>
              <Label>{t('Currency')}</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger className='w-full rounded-xl'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className='space-y-1'>
            <Label>{t('Description')}</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={6}
              className='resize-none rounded-xl'
            />
          </div>

          <div className='space-y-1'>
            <Label>{t('Requirements')}</Label>
            <Textarea
              value={requirements}
              onChange={(e) => setRequirements(e.target.value)}
              rows={4}
              className='resize-none rounded-xl'
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant='outline' className='rounded-xl' onClick={() => onOpenChange(false)}>
            {t('Cancel')}
          </Button>
          <Button className='rounded-xl' disabled={save.isPending} onClick={() => save.mutate()}>
            {save.isPending && <Loader2 className='me-1.5 size-3.5 animate-spin' />}
            {t('Save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
