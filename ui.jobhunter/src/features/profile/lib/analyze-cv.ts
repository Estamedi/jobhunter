import {
  profileApi,
  type ParsedProfile,
  type ProfileImportJob,
  type ProfileImportStatus,
} from '../api'

// Reading a CV happens in the background on the server, so the screen asks for the result every couple of
// seconds. Every request is short, so no proxy cuts it, and the job stays on the server if the window closes.
const IMPORT_POLL_MS = 2000
// Longer than any CV takes. After this the screen gives up waiting; the job itself carries on.
const IMPORT_MAX_WAIT_MS = 5 * 60 * 1000

// The job failed, or took too long. The message is written for the user.
export class ImportFailedError extends Error {}

export const isImportRunning = (status: ProfileImportStatus) =>
  status === 'Pending' || status === 'Running'

interface WaitOptions {
  intervalMs?: number
  timeoutMs?: number
  get?: (id: number) => Promise<ProfileImportJob>
  sleep?: (ms: number) => Promise<void>
}

const wait = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms))

// A few failed polls in a row are expected during a deploy (the server restarts for a few seconds and the job is
// put back in the queue). More than this and the connection is treated as lost.
const MAX_POLL_FAILURES = 5

const COME_BACK = 'Come back in a moment to pick up the result.'

// Polls a job until it is Completed (returns the parsed profile) or Failed (throws its message).
export async function waitForImport(
  job: ProfileImportJob,
  {
    intervalMs = IMPORT_POLL_MS,
    timeoutMs = IMPORT_MAX_WAIT_MS,
    get = profileApi.getImportJob,
    sleep = wait,
  }: WaitOptions = {}
): Promise<ParsedProfile> {
  let current = job
  let waited = 0
  let failures = 0
  for (;;) {
    if (current.status === 'Completed' && current.result) return current.result
    if (current.status === 'Failed') {
      throw new ImportFailedError(
        current.error || 'Could not read this CV. Try again.'
      )
    }
    if (waited >= timeoutMs) {
      throw new ImportFailedError(
        `Reading your CV is taking longer than expected. ${COME_BACK}`
      )
    }
    await sleep(intervalMs)
    waited += intervalMs
    try {
      current = await get(current.id)
      failures = 0
    } catch {
      // The job carries on in the server whatever happens to this request, so a hiccup is not a failed CV.
      failures += 1
      if (failures >= MAX_POLL_FAILURES) {
        throw new ImportFailedError(
          `The connection was lost, but your CV is still being read. ${COME_BACK}`
        )
      }
    }
  }
}

// Starts reading an uploaded CV and waits for the result.
export async function analyzeCv(
  cvId: number,
  options: WaitOptions & {
    start?: (cvId: number) => Promise<ProfileImportJob>
  } = {}
): Promise<ParsedProfile> {
  const { start = profileApi.startImport, ...wait } = options
  return waitForImport(await start(cvId), wait)
}
