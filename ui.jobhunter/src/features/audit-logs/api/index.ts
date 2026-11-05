import { http } from '@/lib/http'

export interface AuditLog {
  id: number
  timestamp: string
  userId: string | null
  userEmail: string | null
  action: string
  payload: string | null
  succeeded: boolean
  error: string | null
  durationMs: number
}

export interface AuditLogsResult {
  items: AuditLog[]
  pageNumber: number
  totalPages: number
  totalCount: number
}

export interface AuditLogFilters {
  search?: string
  action?: string
  succeeded?: boolean
  page?: number
  pageSize?: number
}

export const auditLogsApi = {
  list: (filters: AuditLogFilters = {}) =>
    http
      .get<AuditLogsResult>('/api/AuditLogs', { params: filters })
      .then((r) => r.data),
}
