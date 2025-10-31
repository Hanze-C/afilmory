import { useQuery } from '@tanstack/react-query'

import { fetchDashboardOverview } from './api'
import type { DashboardOverviewResponse } from './types'

export const DASHBOARD_OVERVIEW_QUERY_KEY = ['dashboard', 'overview'] as const

export const useDashboardOverviewQuery = () =>
  useQuery<DashboardOverviewResponse>({
    queryKey: DASHBOARD_OVERVIEW_QUERY_KEY,
    queryFn: fetchDashboardOverview,
    staleTime: 60 * 1000,
  })
