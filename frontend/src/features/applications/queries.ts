import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { api } from "@/lib/api"
import type { ApplicationStatus, CandidateApplication, JobSummary, Page } from "@/types/api"

export type ApplicationFilters = { page: number; size: number; status?: ApplicationStatus }

export const useMyApplications = (filters: ApplicationFilters) =>
  useQuery({
    queryKey: ["my-applications", filters],
    queryFn: () => api.get<Page<CandidateApplication>>("/candidate/applications", filters),
    placeholderData: keepPreviousData,
  })

export function useWithdrawApplication() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.post<CandidateApplication>(`/candidate/applications/${id}/withdraw`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["my-applications"] }),
  })
}

export const useSavedJobs = () => useQuery({ queryKey: ["saved-jobs"], queryFn: () => api.get<JobSummary[]>("/candidate/saved-jobs") })
