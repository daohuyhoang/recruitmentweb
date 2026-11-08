import { useEffect, type ReactNode } from "react"
import { Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom"
import { Toaster } from "sonner"

import { SiteFooter } from "@/components/layout/site-footer"
import { SiteHeader } from "@/components/layout/site-header"
import { RequireAuth } from "@/features/auth/require-auth"
import { useTheme } from "@/lib/theme"
import { LoginPage } from "@/pages/auth/login-page"
import { RegisterPage } from "@/pages/auth/register-page"
import { AccountPage } from "@/pages/candidate/account-page"
import { ApplicationsPage } from "@/pages/candidate/applications-page"
import { CvEditPage } from "@/pages/candidate/cv-edit-page"
import { CvExportPage } from "@/pages/candidate/cv-export-page"
import { CvListPage } from "@/pages/candidate/cv-list-page"
import { MatchedJobsPage } from "@/pages/candidate/matched-jobs-page"
import { SavedJobsPage } from "@/pages/candidate/saved-jobs-page"
import { HomePage } from "@/pages/home-page"
import { JobDetailPage } from "@/pages/jobs/job-detail-page"
import { JobsPage } from "@/pages/jobs/jobs-page"

function PublicLayout({ withFooter = true }: { withFooter?: boolean }) {
  const { pathname } = useLocation()
  // Không trả về kết quả của scrollTo: trình duyệt mới trả về Promise, React sẽ coi nhầm là hàm cleanup
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return (
    <div className="flex min-h-svh flex-col">
      <SiteHeader />
      <div className="flex-1">
        <Outlet />
      </div>
      {withFooter && <SiteFooter />}
    </div>
  )
}

const candidateOnly = (page: ReactNode) => <RequireAuth role="candidate">{page}</RequireAuth>

export default function App() {
  const { theme } = useTheme()
  return (
    <>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route index element={<HomePage />} />
          <Route path="/viec-lam" element={<JobsPage />} />
          <Route path="/viec-lam/:id" element={<JobDetailPage />} />
          <Route
            path="/viec-phu-hop"
            element={
              <RequireAuth role="candidate">
                <MatchedJobsPage />
              </RequireAuth>
            }
          />
          <Route path="/cv" element={candidateOnly(<CvListPage />)} />
          <Route path="/cv/:id" element={candidateOnly(<CvEditPage />)} />
          <Route path="/ho-so-da-nop" element={candidateOnly(<ApplicationsPage />)} />
          <Route path="/viec-da-luu" element={candidateOnly(<SavedJobsPage />)} />
          <Route
            path="/tai-khoan"
            element={
              <RequireAuth>
                <AccountPage />
              </RequireAuth>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
        <Route element={<PublicLayout withFooter={false} />}>
          <Route path="/dang-nhap" element={<LoginPage />} />
          <Route path="/dang-ky" element={<RegisterPage />} />
        </Route>
        {/* Trang xuất PDF không có header, footer để bản in chỉ còn nội dung CV */}
        <Route path="/cv/:id/xuat-pdf" element={candidateOnly(<CvExportPage />)} />
      </Routes>
      <Toaster theme={theme} position="top-right" richColors closeButton />
    </>
  )
}
