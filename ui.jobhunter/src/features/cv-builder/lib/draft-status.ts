import { isWriting, type CvDraftStatus } from '../api'

// What the page should announce when a draft's status changes. Only a draft that was being written
// can "finish": a draft opened already Completed must not toast again.
export function finishedEvent(
  previous: CvDraftStatus | undefined,
  next: CvDraftStatus | undefined
): 'ready' | 'failed' | null {
  if (!isWriting(previous)) return null
  if (next === 'Completed') return 'ready'
  if (next === 'Failed') return 'failed'
  return null
}

// How often to ask the server again while a draft is being written.
export const POLL_MS = 4000

export function pollInterval(
  status: CvDraftStatus | undefined
): number | false {
  return isWriting(status) ? POLL_MS : false
}

// The drafts list asks again while any draft in it is still being written, so a queued batch
// shows its progress even when the live hub is not connected.
export function listPollInterval(
  items: { status?: CvDraftStatus }[] | undefined
): number | false {
  return items?.some((d) => isWriting(d.status)) ? POLL_MS : false
}
