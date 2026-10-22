import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { type ProfileSkill } from '../api'

export function SkillsSection({
  skills,
  isAdding,
  onAdd,
  onRemove,
}: {
  skills: ProfileSkill[]
  isAdding: boolean
  onAdd: (name: string, category: string) => void
  onRemove: (skill: ProfileSkill) => void
}) {
  const [name, setName] = useState('')
  const [category, setCategory] = useState('')

  const groups = new Map<string, ProfileSkill[]>()
  for (const skill of skills) {
    const key = skill.category?.trim() || 'Other'
    groups.set(key, [...(groups.get(key) ?? []), skill])
  }

  const submit = () => {
    if (!name.trim()) return
    onAdd(name.trim(), category.trim())
    setName('')
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
              {items.map((s) => (
                <span
                  key={s.id}
                  className='flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-sm'
                >
                  {s.name}
                  <button
                    type='button'
                    aria-label={`Remove ${s.name}`}
                    onClick={() => onRemove(s)}
                  >
                    <X className='h-3 w-3' />
                  </button>
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className='flex flex-wrap gap-2'>
        <Input
          className='min-w-40 flex-1'
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              submit()
            }
          }}
          placeholder='Add a skill'
        />
        <Input
          className='w-40'
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              submit()
            }
          }}
          placeholder='Group (optional)'
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
