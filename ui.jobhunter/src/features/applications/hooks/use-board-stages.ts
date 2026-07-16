import { useEffect, useState } from 'react'
import { STATUS_COLORS, STATUSES, formatStatusLabel } from '../data/constants'

export type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline'

export interface BoardStage {
  status: string
  label: string
  badgeVariant: BadgeVariant
  visible: boolean
}

export const BADGE_VARIANTS: BadgeVariant[] = ['default', 'secondary', 'destructive', 'outline']

const STORAGE_KEY = 'applications.boardStages.v1'

function defaultStages(): BoardStage[] {
  return STATUSES.map((status) => ({
    status,
    label: formatStatusLabel(status),
    badgeVariant: STATUS_COLORS[status] ?? 'secondary',
    visible: true,
  }))
}

function loadStages(): BoardStage[] {
  if (typeof window === 'undefined') return defaultStages()
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultStages()
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed) || parsed.length === 0) return defaultStages()
    return parsed
  } catch {
    return defaultStages()
  }
}

function saveStages(stages: BoardStage[]) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stages))
  } catch {
    // localStorage unavailable (private mode, quota, etc.) - customization just won't persist
  }
}

function slugify(label: string, existing: string[]): string {
  const words = label
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  const base = words.map((w) => w[0].toUpperCase() + w.slice(1)).join('') || 'Stage'
  let candidate = base
  let i = 2
  while (existing.includes(candidate)) {
    candidate = `${base}${i}`
    i += 1
  }
  return candidate
}

export function useBoardStages() {
  const [stages, setStages] = useState<BoardStage[]>(loadStages)

  useEffect(() => {
    saveStages(stages)
  }, [stages])

  function addStage(label: string, badgeVariant: BadgeVariant = 'secondary') {
    const trimmed = label.trim()
    if (!trimmed) return
    setStages((prev) => [
      ...prev,
      { status: slugify(trimmed, prev.map((s) => s.status)), label: trimmed, badgeVariant, visible: true },
    ])
  }

  function renameStage(status: string, label: string) {
    const trimmed = label.trim()
    if (!trimmed) return
    setStages((prev) => prev.map((s) => (s.status === status ? { ...s, label: trimmed } : s)))
  }

  function setStageColor(status: string, badgeVariant: BadgeVariant) {
    setStages((prev) => prev.map((s) => (s.status === status ? { ...s, badgeVariant } : s)))
  }

  function toggleVisibility(status: string) {
    setStages((prev) => prev.map((s) => (s.status === status ? { ...s, visible: !s.visible } : s)))
  }

  function reorderStage(status: string, direction: 'up' | 'down') {
    setStages((prev) => {
      const index = prev.findIndex((s) => s.status === status)
      const swapWith = direction === 'up' ? index - 1 : index + 1
      if (index === -1 || swapWith < 0 || swapWith >= prev.length) return prev
      const next = [...prev]
      ;[next[index], next[swapWith]] = [next[swapWith], next[index]]
      return next
    })
  }

  function removeStage(status: string) {
    setStages((prev) => prev.filter((s) => s.status !== status))
  }

  function resetToDefault() {
    setStages(defaultStages())
  }

  return {
    stages,
    visibleStages: stages.filter((s) => s.visible),
    addStage,
    renameStage,
    setStageColor,
    toggleVisibility,
    reorderStage,
    removeStage,
    resetToDefault,
  }
}
