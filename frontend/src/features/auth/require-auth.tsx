import type { ReactNode } from "react"
import { Navigate, useLocation } from "react-router-dom"

import { PageBanner } from "@/components/layout/page-banner"
import type { Role } from "@/types/api"
import { useAuth } from "./auth-context"

// Trang cần đăng nhập: chưa đăng nhập thì chuyển tới trang đăng nhập, sai vai trò thì báo không có quyền
export function RequireAuth({ role, children }: { role?: Role; children: ReactNode }) {
  const { user, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) return null
  if (!user) {
    return <Navigate to={`/dang-nhap?tiep=${encodeURIComponent(location.pathname + location.search)}`} replace />
  }
  if (role && user.role !== role) {
    return (
      <PageBanner
        title="Bạn không có quyền xem trang này"
        description="Trang này chỉ dành cho tài khoản khác vai trò. Hãy đăng nhập bằng tài khoản phù hợp."
      />
    )
  }
  return children
}
