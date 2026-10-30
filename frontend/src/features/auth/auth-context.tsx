import { useQuery, useQueryClient } from "@tanstack/react-query"
import { createContext, useCallback, useContext, useMemo, type ReactNode } from "react"

import { api, getToken, setToken } from "@/lib/api"
import type { Role, TokenOut, User } from "@/types/api"

type RegisterInput = {
  email: string
  password: string
  full_name: string
  phone?: string
  role: Exclude<Role, "admin">
  company_name?: string
}

type AuthContextValue = {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<User>
  register: (data: RegisterInput) => Promise<User>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const { data: user, isLoading } = useQuery({
    queryKey: ["me"],
    queryFn: () => (getToken() ? api.get<User>("/auth/me") : Promise.resolve(null)),
    retry: false,
    staleTime: Infinity,
  })

  // Dữ liệu cũ thuộc về người dùng trước (hoặc khách). Không dùng clear(): nó xóa cả query "me"
  // khiến component đang theo dõi vẫn giữ dữ liệu cũ.
  const resetOtherQueries = useCallback(
    () => queryClient.resetQueries({ predicate: (query) => query.queryKey[0] !== "me" }),
    [queryClient],
  )

  const signIn = useCallback(
    (result: TokenOut) => {
      setToken(result.access_token)
      queryClient.setQueryData(["me"], result.user)
      resetOtherQueries()
      return result.user
    },
    [queryClient, resetOtherQueries],
  )

  const value = useMemo<AuthContextValue>(
    () => ({
      user: user ?? null,
      isLoading,
      login: async (email, password) => signIn(await api.post<TokenOut>("/auth/login", { email, password })),
      register: async (data) => signIn(await api.post<TokenOut>("/auth/register", data)),
      logout: () => {
        setToken(null)
        queryClient.setQueryData(["me"], null)
        resetOtherQueries()
      },
    }),
    [user, isLoading, signIn, queryClient, resetOtherQueries],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth phải nằm trong AuthProvider")
  return ctx
}
