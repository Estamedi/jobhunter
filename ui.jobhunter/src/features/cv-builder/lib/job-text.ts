// The text the AI tailors a CV to: the posting's description plus its requirements.
export function jobPostingText(
  description?: string | null,
  requirements?: string | null
) {
  return [
    description?.trim(),
    requirements?.trim() && `Requirements:\n${requirements.trim()}`,
  ]
    .filter(Boolean)
    .join('\n\n')
}
