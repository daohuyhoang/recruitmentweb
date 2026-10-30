import { keepPreviousData, useQuery } from "@tanstack/react-query"

import { api } from "@/lib/api"
import type { Match, TopMatches } from "@/types/api"

export type MatchFilters = { cv_id?: number; city_id?: number; category_id?: number; salary_min?: number }

export const useTopMatches = (filters: MatchFilters) =>
  useQuery({
    queryKey: ["top-matches", filters],
    queryFn: () => api.get<TopMatches>("/candidate/matches", filters),
    placeholderData: keepPreviousData,
    retry: false,
  })

export const useJobMatch = (jobId: number, enabled: boolean, cvId?: number) =>
  useQuery({
    queryKey: ["job-match", jobId, cvId],
    queryFn: () => api.get<Match>(`/candidate/jobs/${jobId}/match`, { cv_id: cvId }),
    enabled,
    retry: false,
  })
