import { http } from '@/lib/http'

export interface OverallDashboard {
  totalCandidates: number
  activeCandidates: number
  totalApplications: number
  activeApplications: number
  totalInterviews: number
  upcomingInterviews: number
  totalCompanies: number
  offersReceived: number
  followUpsDueToday: number
  followUpsOverdue: number
  recentActivities: RecentActivity[]
  upcomingInterviewsList: UpcomingInterview[]
}

export interface RecentActivity {
  id: number
  type: string
  candidateName: string
  companyName?: string
  notes?: string
  activityDate: string
}

export interface UpcomingInterview {
  id: number
  candidateName: string
  companyName: string
  jobRoleTitle?: string
  round: string
  interviewDate: string
  status: string
}

export interface ReportStatistics {
  applicationsByStatus: Record<string, number>
  applicationsByCandidate: Record<string, number>
  applicationsByCountry: Record<string, number>
  applicationsByWorkType: Record<string, number>
  monthlyApplicationTrend: MonthlyTrend[]
  responseRate: number
  interviewConversionRate: number
  offerRate: number
}

export interface MonthlyTrend {
  month: string
  count: number
}

export const dashboardApi = {
  overall: () =>
    http.get<OverallDashboard>('/api/dashboard/overall').then((r) => r.data),

  reports: () =>
    http.get<ReportStatistics>('/api/dashboard/reports').then((r) => r.data),
}
