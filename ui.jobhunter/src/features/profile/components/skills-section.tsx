import { useState } from 'react'
import { Pencil, Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
  return (
    <Select
      value={value || NOT_SET}
      onValueChange={(v) => onChange(v === NOT_SET ? '' : v)}
    >
      <SelectTrigger
        className={className}
        aria-label='How do you know this skill?'
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={NOT_SET}>Level: not set</SelectItem>
        {SKILL_EVIDENCE_LEVELS.map((l) => (
          <SelectItem key={l.value} value={l.value}>
            {l.label} ({l.hint.toLowerCase()})
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
        <button type='button' aria-label={`Edit ${skill.name}`}>
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
          placeholder='Where did you use it? (optional)'
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
          Save
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
}: {
  skills: ProfileSkill[]
  isAdding: boolean
  isUpdating: boolean
  onAdd: (skill: NewSkill) => void
  onUpdate: (id: number, dto: SaveSkillDto) => void
  onRemove: (skill: ProfileSkill) => void
}) {
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
    <section className='rounded-md border p-5'>
      <h2 className='mb-4 text-xl font-semibold'>Skills</h2>

      {skills.length === 0 && (
        <p className='mb-4 text-sm text-muted-foreground'>
          No skills yet. Add the ones you want on your CV.
        </p>
      )}

      <div className='mb-4 space-y-3'>
        {[...groups.entries()].map(([group, items]) => (
          <div key={group}>
            <p className='mb-1 text-xs font-medium text-muted-foreground uppercase'>
              {group}
            </p>
            <div className='flex flex-wrap gap-2'>
              {items.map((s) => {
                const levelLabel = skillLevelLabel(s.evidenceLevel)
                return (
                  <span
                    key={s.id}
                    title={s.note ?? undefined}
                    className='flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-sm'
                  >
                    {s.name}
                    {levelLabel && (
                      <span className='text-xs text-muted-foreground'>
                        · {levelLabel}
                      </span>
                    )}
                    <EditSkill
                      skill={s}
                      isUpdating={isUpdating}
                      onUpdate={onUpdate}
                    />
                    <button
                      type='button'
                      aria-label={`Remove ${s.name}`}
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

      <div className='flex flex-wrap gap-2'>
        <Input
          className='min-w-40 flex-1'
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={onEnter}
          placeholder='Add a skill'
        />
        <Input
          className='w-40'
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          onKeyDown={onEnter}
          placeholder='Group (optional)'
        />
        <LevelSelect value={level} onChange={setLevel} className='w-56' />
        <Input
          className='min-w-40 flex-1'
          value={note}
          maxLength={MAX_SKILL_NOTE_LENGTH}
          onChange={(e) => setNote(e.target.value)}
          onKeyDown={onEnter}
          placeholder='Where did you use it? (optional)'
        />
        <Button
          type='button'
          variant='outline'
          disabled={!name.trim() || isAdding}
          onClick={submit}
        >
          <Plus className='mr-1 h-4 w-4' /> Add skill
        </Button>
      </div>
    </section>
  )
}
