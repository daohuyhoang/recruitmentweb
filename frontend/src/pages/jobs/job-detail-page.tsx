import { Bookmark, BookmarkCheck, CircleCheck, Send, Sparkles } from "lucide-react"
import { useState, type ReactNode } from "react"
import { useLocation, useNavigate, useParams } from "react-router-dom"
import { toast } from "sonner"

import { ButtonLink } from "@/components/common/button-link"
import { EmptyState, ErrorState } from "@/components/common/states"
import { PageBanner } from "@/components/layout/page-banner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuth } from "@/features/auth/auth-context"
import { ApplyDialog } from "@/features/jobs/components/apply-dialog"
import { useJob, useToggleSaveJob } from "@/features/jobs/queries"
import { MatchSummary } from "@/features/matching/components/match-summary"
import { useJobMatch } from "@/features/matching/queries"
import { ApiError } from "@/lib/api"
import { formatDate, formatExperience, formatNumber, formatSalary, toBulletLines } from "@/lib/format"
import { EDUCATION_LABELS, EMPLOYMENT_TYPE_LABELS, WORK_MODE_LABELS } from "@/lib/labels"
import type { JobDetail } from "@/types/api"

function ContentSection({ title, text }: { title: string; text: string | null }) {
  const lines = toBulletLines(text)
  if (lines.length === 0) return null
  return (
    <section className="border-t p-6 first:border-t-0 sm:p-8">
      <h2 className="text-xl font-bold">{title}</h2>
      <ul className="mt-4 grid gap-2.5">
        {lines.map((line) => (
          <li key={line} className="flex gap-3 leading-relaxed">
            <span aria-hidden="true" className="mt-2.5 size-1.5 shrink-0 rounded-full bg-brand" />
            {line}
          </li>
        ))}
      </ul>
    </section>
  )
}

function InfoRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex justify-between gap-4 border-t py-3 first:border-t-0 first:pt-0">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-semibold">{children}</dd>
    </div>
  )
}

/** Chức năng 2: mức độ phù hợp của CV với việc này và kỹ năng còn thiếu */
function MatchPanel({ job }: { job: JobDetail }) {
  const { user } = useAuth()
  const location = useLocation()
  const isCandidate = user?.role === "candidate"
  const { data, error, isLoading } = useJobMatch(job.id, isCandidate)

  if (user && !isCandidate) return null
  return (
    <Card className="gap-0 py-0">
      <div className="flex items-center gap-2 border-b p-5">
        <Sparkles className="size-5 text-primary" aria-hidden="true" />
        <h2 className="font-heading text-lg font-bold">CV của bạn so với việc này</h2>
      </div>
      {!user ? (
        <div className="p-5">
          <p className="leading-relaxed text-muted-foreground">
            Đăng nhập để xem CV của bạn đáp ứng bao nhiêu phần trăm yêu cầu và còn thiếu kỹ năng nào.
          </p>
          <ButtonLink className="mt-4 h-11 w-full font-bold uppercase" to={`/dang-nhap?tiep=${encodeURIComponent(location.pathname)}`}>
            Đăng nhập để xem
          </ButtonLink>
        </div>
      ) : isLoading ? (
        <div className="grid gap-3 p-5">
          <Skeleton className="h-12 w-40" />
          <Skeleton className="h-32" />
          <p className="text-[13px] text-muted-foreground">Đang so khớp CV với tin tuyển dụng…</p>
        </div>
      ) : error ? (
        <div className="p-5">
          <p className="text-muted-foreground">
            {error instanceof ApiError && error.status === 404 ? "Bạn chưa có CV để so khớp." : (error as Error).message}
          </p>
          {error instanceof ApiError && error.status === 404 && (
            <ButtonLink className="mt-4 h-11 w-full font-bold uppercase" to="/cv">
              Tải CV lên
            </ButtonLink>
          )}
        </div>
      ) : data ? (
        <MatchSummary match={data} />
      ) : null}
    </Card>
  )
}

export function JobDetailPage() {
  const { id } = useParams()
  const jobId = Number(id)
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const { data: job, error, isLoading } = useJob(jobId)
  const toggleSave = useToggleSaveJob(jobId)
  const [applyOpen, setApplyOpen] = useState(false)

  if (isLoading) {
    return (
      <main>
        <div className="h-48 bg-hero" />
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_400px] lg:px-8">
          <Skeleton className="h-96 rounded-lg" />
          <Skeleton className="h-72 rounded-lg" />
        </div>
      </main>
    )
  }
  if (error || !job) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16">
        {error instanceof ApiError && error.status === 404 ? (
          <EmptyState
            title="Không tìm thấy tin tuyển dụng"
            description="Tin có thể đã bị gỡ hoặc đường dẫn không đúng."
            action={
              <ButtonLink to="/viec-lam" className="h-11 px-5 font-bold uppercase">
                Xem việc làm khác
              </ButtonLink>
            }
          />
        ) : (
          <ErrorState error={error} />
        )}
      </main>
    )
  }

  const isOpen = job.status === "approved"
  const isCandidate = user?.role === "candidate"
  const applied = job.application_id !== null && job.application_id !== undefined

  function handleApplyClick() {
    if (!user) {
      navigate(`/dang-nhap?tiep=${encodeURIComponent(location.pathname)}`)
      return
    }
    setApplyOpen(true)
  }

  function handleSave() {
    if (!user) {
      navigate(`/dang-nhap?tiep=${encodeURIComponent(location.pathname)}`)
      return
    }
    toggleSave.mutate(Boolean(job?.is_saved), {
      onSuccess: () => toast.success(job?.is_saved ? "Đã bỏ lưu việc" : "Đã lưu việc"),
      onError: (err) => toast.error(err.message),
    })
  }

  const applyButton = applied ? (
    <ButtonLink to={`/ho-so-da-nop?ho-so=${job.application_id}`} className="h-11 bg-white px-5 font-bold text-hero uppercase hover:bg-white/90">
      <CircleCheck data-icon="inline-start" />
      Xem hồ sơ đã nộp
    </ButtonLink>
  ) : (
    <Button
      onClick={handleApplyClick}
      disabled={!isOpen || (Boolean(user) && !isCandidate)}
      className="h-11 bg-white px-5 font-bold text-hero uppercase hover:bg-white/90"
    >
      <Send data-icon="inline-start" />
      {isOpen ? "Ứng tuyển ngay" : "Đã đóng nhận hồ sơ"}
    </Button>
  )

  return (
    <main>
      <PageBanner
        title={job.title}
        breadcrumb={[{ to: "/", label: "Trang chủ" }, { to: "/viec-lam", label: "Việc làm" }, { label: job.title }]}
        description={
          <>
            {job.company.name} · {job.city.name} · <span className="font-semibold">{formatSalary(job.salary_min, job.salary_max)}</span>
          </>
        }
        actions={
          <div className="flex flex-wrap gap-2">
            {applyButton}
            {(!user || isCandidate) && (
              <Button
                variant="outline"
                onClick={handleSave}
                disabled={toggleSave.isPending}
                className="h-11 border-hero-foreground/40 bg-transparent px-4 font-bold text-hero-foreground uppercase hover:bg-hero-foreground hover:text-hero dark:bg-transparent"
              >
                {job.is_saved ? <BookmarkCheck data-icon="inline-start" /> : <Bookmark data-icon="inline-start" />}
                {job.is_saved ? "Đã lưu" : "Lưu việc"}
              </Button>
            )}
          </div>
        }
      />

      <div className="mx-auto grid max-w-7xl items-start gap-6 px-4 pt-8 pb-16 sm:px-6 lg:grid-cols-[minmax(0,1fr)_400px] lg:px-8">
        <div className="grid gap-6">
          <Card className="gap-0 py-0">
            <ContentSection title="Mô tả công việc" text={job.description} />
            <ContentSection title="Yêu cầu ứng viên" text={job.requirements} />
            <ContentSection title="Quyền lợi" text={job.benefits} />
            <section className="border-t p-6 sm:p-8">
              <h2 className="text-xl font-bold">Kỹ năng yêu cầu</h2>
              {(["Bắt buộc", "Ưu tiên"] as const).map((label) => {
                const skills = job.skills.filter((s) => s.required === (label === "Bắt buộc"))
                if (skills.length === 0) return null
                return (
                  <div key={label} className="mt-4 flex flex-wrap items-center gap-2">
                    <span className="w-20 text-sm text-muted-foreground">{label}</span>
                    {skills.map((s) => (
                      <Badge key={s.skill_id} variant="outline" className="h-7 rounded-sm bg-muted px-2.5 text-sm font-normal">
                        {s.name}
                      </Badge>
                    ))}
                  </div>
                )
              })}
            </section>
          </Card>
        </div>

        <aside className="grid gap-6 lg:sticky lg:top-22">
          <MatchPanel job={job} />
          <Card className="gap-0 p-5">
            <h2 className="mb-4 font-heading text-lg font-bold">Thông tin chung</h2>
            <dl className="text-sm">
              <InfoRow label="Mức lương">
                <span className="text-primary">{formatSalary(job.salary_min, job.salary_max)}</span>
              </InfoRow>
              <InfoRow label="Kinh nghiệm">{formatExperience(job.experience_min_years, job.experience_max_years)}</InfoRow>
              <InfoRow label="Học vấn">{EDUCATION_LABELS[job.education_level]}</InfoRow>
              <InfoRow label="Loại hình">{EMPLOYMENT_TYPE_LABELS[job.employment_type]}</InfoRow>
              <InfoRow label="Hình thức">{WORK_MODE_LABELS[job.work_mode]}</InfoRow>
              <InfoRow label="Số lượng tuyển">{job.vacancies} người</InfoRow>
              <InfoRow label="Địa điểm">{job.address ? `${job.address}, ${job.city.name}` : job.city.name}</InfoRow>
              <InfoRow label="Hạn nộp">{formatDate(job.deadline)}</InfoRow>
              <InfoRow label="Lượt xem">{formatNumber(job.view_count)}</InfoRow>
            </dl>
          </Card>
          <Card className="gap-0 p-5">
            <p className="text-[13px] font-semibold text-muted-foreground">Nhà tuyển dụng</p>
            <p className="mt-1 font-heading text-lg font-bold">{job.company.name}</p>
            {job.company.is_verified && (
              <Badge variant="success" className="mt-2">
                <CircleCheck /> Đã xác thực
              </Badge>
            )}
          </Card>
        </aside>
      </div>

      {isCandidate && <ApplyDialog job={job} open={applyOpen} onOpenChange={setApplyOpen} />}
    </main>
  )
}
