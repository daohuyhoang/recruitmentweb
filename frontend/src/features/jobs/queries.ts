import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { api } from "@/lib/api"
import type { CandidateApplication, Cv, JobDetail, JobSummary, Message, Page } from "@/types/api"

export type JobFilters = {
  q?: string
  category_id?: number
  city_id?: number
  employment_type?: string
  work_mode?: string
  salary_min?: number
  sort?: "newest" | "salary" | "deadline"
  page?: number
  size?: number
}

export const useJobs = (filters: JobFilters) =>
  useQuery({
    queryKey: ["jobs", filters],
    queryFn: () => api.get<Page<JobSummary>>("/jobs", filters),
    placeholderData: keepPreviousData,
  })

export const useJob = (id: number) =>
  useQuery({ queryKey: ["job", id], queryFn: () => api.get<JobDetail>(`/jobs/${id}`), enabled: Number.isFinite(id) })

export const useMyCvs = (enabled = true) =>
  useQuery({ queryKey: ["my-cvs"], queryFn: () => api.get<Cv[]>("/candidate/cvs"), enabled })

export function useToggleSaveJob(jobId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (saved: boolean) =>
      saved ? api.delete<Message>(`/candidate/saved-jobs/${jobId}`) : api.post<Message>(`/candidate/saved-jobs/${jobId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["job", jobId] })
      queryClient.invalidateQueries({ queryKey: ["saved-jobs"] })
    },
  })
}

export function useApply(jobId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: { cv_id: number; cover_letter?: string }) =>
      api.post<CandidateApplication>("/candidate/applications", { job_id: jobId, ...data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["job", jobId] })
      queryClient.invalidateQueries({ queryKey: ["my-applications"] })
    },
  })
}
