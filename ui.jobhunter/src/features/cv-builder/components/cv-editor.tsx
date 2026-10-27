import { type CvContent, type CvSection } from '../api'
import { SectionEditor } from './section-editor'

const ALL_SECTIONS: CvSection[] = [
  'headline',
  'summary',
  'skills',
  'projects',
  'experience',
  'education',
  'certifications',
  'languages',
  'links',
]

// The full editor: every section on one form.
export function CvEditor({
  content,
  isSaving,
  onSave,
  onCancel,
}: {
  content: CvContent
  isSaving: boolean
  onSave: (content: CvContent) => void
  onCancel: () => void
}) {
  return (
    <SectionEditor
      content={content}
      sections={ALL_SECTIONS}
      isSaving={isSaving}
      onSave={onSave}
      onCancel={onCancel}
    />
  )
}
