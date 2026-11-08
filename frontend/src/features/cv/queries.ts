import { keepPreviousData, useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query"

import { api } from "@/lib/api"
import type { CvContent, CvDetail, CvEvaluation, Message, SkillOption } from "@/types/api"

// Đổi CV thì điểm so khớp cũ không còn đúng
function invalidateCvData(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: ["my-cvs"] })
  queryClient.invalidateQueries({ queryKey: ["top-matches"] })
  queryClient.invalidateQueries({ queryKey: ["job-match"] })
}

export const useCv = (id: number) =>
  useQuery({
    queryKey: ["cv", id],
    queryFn: () => api.get<CvDetail>(`/candidate/cvs/${id}`),
    enabled: Number.isFinite(id),
    retry: false,
  })

export function useCreateCv() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (title: string) => api.post<CvDetail>("/candidate/cvs", { title }),
    onSuccess: () => invalidateCvData(queryClient),
  })
}

export function useUploadCv() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (file: File) => {
      const body = new FormData()
      body.append("file", file)
      return api.post<CvDetail>("/candidate/cvs/upload", body)
    },
    onSuccess: () => invalidateCvData(queryClient),
  })
}

export function useUpdateCv(id: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: { title: string; content: CvContent }) => api.put<CvDetail>(`/candidate/cvs/${id}`, data),
    onSuccess: (cv) => {
      queryClient.setQueryData(["cv", id], cv)
      invalidateCvData(queryClient)
    },
  })
}

export function useSetDefaultCv() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.post<Message>(`/candidate/cvs/${id}/default`),
    onSuccess: () => invalidateCvData(queryClient),
  })
}

export function useDeleteCv() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.delete<Message>(`/candidate/cvs/${id}`),
    onSuccess: () => invalidateCvData(queryClient),
  })
}

export const useEvaluateCv = (id: number) =>
  useMutation({
    mutationFn: (jobId: number | undefined) => api.post<CvEvaluation>(`/candidate/cvs/${id}/evaluate`, undefined, { job_id: jobId }),
  })

export const useSkillOptions = (q: string) =>
  useQuery({
    queryKey: ["skill-options", q],
    queryFn: () => api.get<SkillOption[]>("/skills", { q, limit: 8 }),
    enabled: q.trim().length > 0,
    placeholderData: keepPreviousData,
    staleTime: 5 * 60_000,
  })
