import { useState } from 'react'
import { Pencil, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { type ProfileSkill, type SaveSkillDto } from '../api'
import {
  MAX_SKILL_NOTE_LENGTH,
  SKILL_EVIDENCE_LEVELS,
  skillLevelLabel,
} from '../lib/skill-evidence'
import { ProfileCard } from './profile-card'

const NOT_SET = 'none'

type NewSkill = {
  name: string
  category: string
  evidenceLevel: string
  note: string
}

function LevelSelect({
  value,
  onChange,
  className,
}: {
  value: string
  onChange: (value: string) => void
  className?: string
}) {
  const { t } = useTranslation()
  return (
    <Select
      value={value || NOT_SET}
      onValueChange={(v) => onChange(v === NOT_SET ? '' : v)}
    >
      <SelectTrigger
        className={className}
        aria-label={t('How do you know this skill?')}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={NOT_SET}>{t('Level: not set')}</SelectItem>
        {SKILL_EVIDENCE_LEVELS.map((l) => (
          <SelectItem key={l.value} value={l.value}>
            {t(l.label)} ({t(l.hint)})
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

function EditSkill({
  skill,
  isUpdating,
  onUpdate,
}: {
  skill: ProfileSkill
  isUpdating: boolean
  onUpdate: (id: number, dto: SaveSkillDto) => void
}) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [level, setLevel] = useState(skill.evidenceLevel ?? '')
  const [note, setNote] = useState(skill.note ?? '')

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (next) {
          setLevel(skill.evidenceLevel ?? '')
          setNote(skill.note ?? '')
        }
      }}
    >
      <PopoverTrigger asChild>
        <button type='button' aria-label={t('Edit {{name}}', { name: skill.name })}>
          <Pencil className='h-3 w-3' />
        </button>
      </PopoverTrigger>
      <PopoverContent className='w-80 space-y-3'>
        <p className='text-sm font-medium'>{skill.name}</p>
        <LevelSelect value={level} onChange={setLevel} className='w-full' />
        <Input
          value={note}
          maxLength={MAX_SKILL_NOTE_LENGTH}
          onChange={(e) => setNote(e.target.value)}
          placeholder={t('Where did you use it? (optional)')}
        />
        <Button
          type='button'
          size='sm'
          disabled={isUpdating}
          onClick={() => {
            onUpdate(skill.id, {
              name: skill.name,
              category: skill.category,
              evidenceLevel: level,
              note: note.trim(),
            })
            setOpen(false)
          }}
        >
          {t('Save')}
        </Button>
      </PopoverContent>
    </Popover>
  )
}

export function SkillsSection({
  skills,
  isAdding,
  isUpdating,
  onAdd,
  onUpdate,
  onRemove,
  openAddSignal = 0,
}: {
  skills: ProfileSkill[]
  isAdding: boolean
  isUpdating: boolean
  onAdd: (skill: NewSkill) => void
  onUpdate: (id: number, dto: SaveSkillDto) => void
  onRemove: (skill: ProfileSkill) => void
  // Goes up when the page asks for the "add" dialog to open (the header's Add section menu).
  openAddSignal?: number
}) {
  const { t } = useTranslation()
  const [adding, setAdding] = useState(false)
  // Opens the dialog when the page's signal goes up, adjusted while rendering as React recommends.
  const [seenSignal, setSeenSignal] = useState(openAddSignal)
  if (seenSignal !== openAddSignal) {
    setSeenSignal(openAddSignal)
    setAdding(true)
  }

  const [name, setName] = useState('')
  const [category, setCategory] = useState('')
  const [level, setLevel] = useState('')
  const [note, setNote] = useState('')

  const groups = new Map<string, ProfileSkill[]>()
  for (const skill of skills) {
    const key = skill.category?.trim() || 'Other'
    groups.set(key, [...(groups.get(key) ?? []), skill])
  }

  const submit = () => {
    if (!name.trim()) return
    onAdd({
      name: name.trim(),
      category: category.trim(),
      evidenceLevel: level,
      note: note.trim(),
    })
    // The dialog stays open so several skills can be added in a row.
    setName('')
    setNote('')
  }

  const onEnter = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      submit()
    }
  }

  return (
    <ProfileCard
      id='section-skills'
      title={t('Skills')}
      addLabel={t('Add skill')}
      onAdd={() => setAdding(true)}
    >
      {skills.length === 0 && (
        <p className='text-sm text-muted-foreground'>
          {t('No skills yet. Add the ones you want on your CV.')}
        </p>
      )}

      <div className='space-y-4'>
        {[...groups.entries()].map(([group, items]) => (
          <div key={group}>
            <p className='mb-1.5 text-xs font-medium text-muted-foreground uppercase'>
              {t(group)}
            </p>
            <div className='flex flex-wrap gap-2'>
              {items.map((s) => {
                const levelLabel = skillLevelLabel(s.evidenceLevel)
                return (
                  <span
                    key={s.id}
                    title={s.note ?? undefined}
                    className='flex items-center gap-1 rounded-full border bg-muted/40 px-3 py-1 text-sm font-medium'
                  >
                    {s.name}
                    {levelLabel && (
                      <span className='text-xs font-normal text-muted-foreground'>
                        · {t(levelLabel)}
                      </span>
                    )}
                    <EditSkill
                      skill={s}
                      isUpdating={isUpdating}
                      onUpdate={onUpdate}
                    />
                    <button
                      type='button'
                      aria-label={t('Remove {{name}}', { name: s.name })}
                      onClick={() => onRemove(s)}
                    >
                      <X className='h-3 w-3' />
                    </button>
                  </span>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      <Dialog open={adding} onOpenChange={setAdding}>
        <DialogContent className='max-w-lg'>
          <DialogHeader>
            <DialogTitle>{t('Add skill')}</DialogTitle>
            <DialogDescription>
              {t('Say how you know it, and where you used it, if you like.')}
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-3'>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={onEnter}
              placeholder={t('Skill, for example Terraform')}
              aria-label={t('Skill')}
            />
            <Input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              onKeyDown={onEnter}
              placeholder={t('Group (optional)')}
              aria-label={t('Group')}
            />
            <LevelSelect value={level} onChange={setLevel} className='w-full' />
            <Input
              value={note}
              maxLength={MAX_SKILL_NOTE_LENGTH}
              onChange={(e) => setNote(e.target.value)}
              onKeyDown={onEnter}
              placeholder={t('Where did you use it? (optional)')}
              aria-label={t('Where did you use it?')}
            />
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setAdding(false)}>
              {t('Done')}
            </Button>
            <Button disabled={!name.trim() || isAdding} onClick={submit}>
              {t('Add skill')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ProfileCard>
  )
}
