import { toast } from 'sonner'
import { http } from '@/lib/http'

export interface WorkerStats {
  enqueued: number
  scheduled: number
  processing: number
  succeeded: number
  failed: number
  deleted: number
  servers: number
  recurring: number
  queues: number
}

export interface WorkerQueue {
  name: string
  length: number
  fetched: number
}

export interface WorkerServer {
  name: string
  workerCount: number
  queues: string[]
  startedAt: string
  heartbeat: string | null
}

export interface WorkerRecurringJob {
  id: string
  name: string | null
  cron: string
  queue: string | null
  nextExecution: string | null
  lastExecution: string | null
  lastJobId: string | null
  lastJobState: string | null
  error: string | null
}

export interface WorkItemCount {
  queue: string
  status: string
  count: number
}

export interface WorkersOverview {
  stats: WorkerStats
  queues: WorkerQueue[]
  servers: WorkerServer[]
  recurring: WorkerRecurringJob[]
  workItems: WorkItemCount[]
}

export type JobState =
  | 'Enqueued'
  | 'Scheduled'
  | 'Processing'
  | 'Succeeded'
  | 'Failed'
  | 'Deleted'

export interface WorkerJob {
  id: string
  name: string
  queue: string | null
  state: string
  since: string | null
  reason: string | null
  error: string | null
  createdAt: string | null
  server: string | null
}

export interface WorkerJobsResult {
  items: WorkerJob[]
  pageNumber: number
  totalPages: number
  totalCount: number
}

export interface WorkerJobDetail {
  id: string
  name: string
  queue: string | null
  state: string
  createdAt: string | null
  history: { state: string; createdAt: string; reason: string | null }[]
}

export const workersApi = {
  overview: () =>
    http.get<WorkersOverview>('/api/Workers/overview').then((r) => r.data),
  jobs: (state: JobState, page: number, pageSize: number) =>
    http
      .get<WorkerJobsResult>('/api/Workers/jobs', {
        params: { state, page, pageSize },
      })
      .then((r) => r.data),
  job: (id: string) =>
    http.get<WorkerJobDetail>(`/api/Workers/jobs/${id}`).then((r) => r.data),
  requeue: (id: string) => http.post(`/api/Workers/jobs/${id}/requeue`),
  remove: (id: string) => http.delete(`/api/Workers/jobs/${id}`),
  dashboardLink: () =>
    http
      .post<{ path: string }>('/api/Workers/dashboard-link')
      .then((r) => r.data.path),
  trigger: (id: string) => http.post(`/api/Workers/recurring/${id}/trigger`),
}

// Hangfire's own dashboard needs a one-minute link from the API; opening it signs this browser in.
export async function openHangfireDashboard() {
  try {
    const path = await workersApi.dashboardLink()
    const base = (import.meta.env.VITE_API_BASE_URL ?? '') as string
    window.open(`${base}${path}`, '_blank', 'noopener')
  } catch {
    toast.error('Could not open the Hangfire dashboard.')
  }
}
