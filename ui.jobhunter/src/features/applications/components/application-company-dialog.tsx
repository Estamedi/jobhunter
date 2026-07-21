import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { companiesApi, type JobCompany } from '@/features/companies/api'
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

const COMPANY_PRIORITIES = ['Low', 'Medium', 'High']

interface ApplicationCompanyDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  company: JobCompany
}

export function ApplicationCompanyDialog({ open, onOpenChange, company }: ApplicationCompanyDialogProps) {
  const qc = useQueryClient()

  const [name, setName] = useState(company.name)
  const [website, setWebsite] = useState(company.website ?? '')
  const [linkedInUrl, setLinkedInUrl] = useState(company.linkedInUrl ?? '')
  const [country, setCountry] = useState(company.country ?? '')
  const [city, setCity] = useState(company.city ?? '')
  const [industry, setIndustry] = useState(company.industry ?? '')
  const [companySize, setCompanySize] = useState(company.companySize ?? '')
  const [priority, setPriority] = useState(company.priority)
  const [notes, setNotes] = useState(company.notes ?? '')

  const save = useMutation({
    mutationFn: async () => {
      const trimmedName = name.trim()
      if (!trimmedName) throw new Error('missing-name')
      await companiesApi.update(company.id, {
        name: trimmedName,
        website: website.trim() || undefined,
        linkedInUrl: linkedInUrl.trim() || undefined,
        country: country.trim() || undefined,
        city: city.trim() || undefined,
        industry: industry.trim() || undefined,
        companySize: companySize.trim() || undefined,
        priority,
        notes: notes.trim() || undefined,
      })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['companies', 'detail', company.id] })
      qc.invalidateQueries({ queryKey: ['applications'] })
      toast.success('Company updated')
      onOpenChange(false)
    },
    onError: (err) => {
      toast.error(err instanceof Error && err.message === 'missing-name' ? 'Company name is required' : 'Failed to update company')
    },
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-h-[85vh] max-w-2xl overflow-y-auto rounded-2xl sm:max-w-2xl'>
        <DialogHeader>
          <DialogTitle>Edit company</DialogTitle>
          <DialogDescription>Update the company details for this application.</DialogDescription>
        </DialogHeader>

        <div className='space-y-4'>
          <div className='space-y-1'>
            <Label>Company name *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} className='rounded-xl' />
          </div>

          <div className='grid grid-cols-2 gap-3'>
            <div className='space-y-1'>
              <Label>Website</Label>
              <Input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder='https://' className='rounded-xl' />
            </div>
            <div className='space-y-1'>
              <Label>LinkedIn</Label>
              <Input
                value={linkedInUrl}
                onChange={(e) => setLinkedInUrl(e.target.value)}
                placeholder='https://linkedin.com/company/'
                className='rounded-xl'
              />
            </div>
            <div className='space-y-1'>
              <Label>Country</Label>
              <Input value={country} onChange={(e) => setCountry(e.target.value)} className='rounded-xl' />
            </div>
            <div className='space-y-1'>
              <Label>City</Label>
              <Input value={city} onChange={(e) => setCity(e.target.value)} className='rounded-xl' />
            </div>
            <div className='space-y-1'>
              <Label>Industry</Label>
              <Input value={industry} onChange={(e) => setIndustry(e.target.value)} className='rounded-xl' />
            </div>
            <div className='space-y-1'>
              <Label>Company size</Label>
              <Input
                value={companySize}
                onChange={(e) => setCompanySize(e.target.value)}
                placeholder='1-50, 51-200, 201-1000...'
                className='rounded-xl'
              />
            </div>
          </div>

          <div className='space-y-1'>
            <Label>Priority</Label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger className='w-full rounded-xl'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COMPANY_PRIORITIES.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className='space-y-1'>
            <Label>Notes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className='resize-none rounded-xl' />
          </div>
        </div>

        <DialogFooter>
          <Button variant='outline' className='rounded-xl' onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button className='rounded-xl' disabled={save.isPending} onClick={() => save.mutate()}>
            {save.isPending && <Loader2 className='mr-1.5 size-3.5 animate-spin' />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
