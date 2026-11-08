import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { api } from "@/lib/api"
import type { Message, Profile, ProfileInput, User } from "@/types/api"

export function useUpdateAccount() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: { full_name: string; phone: string | null }) => api.put<User>("/auth/me", data),
    onSuccess: (user) => queryClient.setQueryData(["me"], user),
  })
}

export const useChangePassword = () =>
  useMutation({
    mutationFn: (data: { current_password: string; new_password: string }) => api.post<Message>("/auth/change-password", data),
  })

export const useProfile = () => useQuery({ queryKey: ["profile"], queryFn: () => api.get<Profile>("/candidate/profile") })

export function useUpdateProfile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: ProfileInput) => api.put<Profile>("/candidate/profile", data),
    onSuccess: (profile) => {
      queryClient.setQueryData(["profile"], profile)
      // Kinh nghiệm, học vấn, địa điểm nằm trong điểm tiêu chí nên phải tính lại
      queryClient.invalidateQueries({ queryKey: ["top-matches"] })
      queryClient.invalidateQueries({ queryKey: ["job-match"] })
    },
  })
}
