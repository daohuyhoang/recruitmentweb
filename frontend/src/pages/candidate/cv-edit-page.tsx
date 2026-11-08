import { FileText, Save } from "lucide-react"
import { useEffect, useState, type FormEvent } from "react"
import { useNavigate, useParams, useSearchParams } from "react-router-dom"
import { toast } from "sonner"

import { ButtonLink } from "@/components/common/button-link"
import { FormError, FormField } from "@/components/common/form-field"
import { EmptyState, ErrorState } from "@/components/common/states"
import { PageBanner } from "@/components/layout/page-banner"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { cleanContent, emptyContent } from "@/features/cv/content"
import { CvForm } from "@/features/cv/components/cv-form"
import { EvaluationPanel } from "@/features/cv/components/evaluation-panel"
import { useCv, useUpdateCv } from "@/features/cv/queries"
import { ApiError } from "@/lib/api"
import type { CvContent, CvDetail } from "@/types/api"

const snapshot = (title: string, content: CvContent) => JSON.stringify({ title: title.trim(), content: cleanContent(content) })

function CvEditor({ cv, initialJobId }: { cv: CvDetail; initialJobId?: number }) {
  const navigate = useNavigate()
  const updateCv = useUpdateCv(cv.id)
  const [title, setTitle] = useState(cv.title)
  const [content, setContent] = useState<CvContent>(() => cv.content ?? emptyContent())
  const [savedState, setSavedState] = useState(() => snapshot(cv.title, cv.content ?? emptyContent()))
  const [error, setError] = useState<string | null>(null)
  const dirty = snapshot(title, content) !== savedState

  // Cảnh báo khi đóng tab lúc còn thay đổi chưa lưu
  useEffect(() => {
    if (!dirty) return
    const warn = (event: BeforeUnloadEvent) => event.preventDefault()
    window.addEventListener("beforeunload", warn)
    return () => window.removeEventListener("beforeunload", warn)
  }, [dirty])

  /** Lưu nếu có thay đổi hoặc CV chưa có nội dung. Trả về false khi không lưu được. */
  async function save(): Promise<boolean> {
    setError(null)
    if (title.trim().length < 2) {
      setError("Tên CV cần ít nhất 2 ký tự")
      return false
    }
    if (!dirty && cv.content) return true
    const clean = cleanContent(content)
    try {
      await updateCv.mutateAsync({ title: title.trim(), content: clean })
      setContent(clean)
      setSavedState(snapshot(title, clean))
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không lưu được CV")
      return false
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (await save()) toast.success("Đã lưu CV")
  }

  async function handleExport() {
    if (await save()) navigate(`/cv/${cv.id}/xuat-pdf`)
  }

  return (
    <main>
      <PageBanner
        title={title.trim() || cv.title}
        breadcrumb={[{ to: "/", label: "Trang chủ" }, { to: "/cv", label: "CV của tôi" }, { label: "Sửa CV" }]}
        description="Sửa nội dung trên form, bấm đánh giá để xem điểm và gợi ý, rồi xuất ra PDF."
        actions={
          <Button onClick={handleExport} disabled={updateCv.isPending} className="h-11 bg-white px-5 font-bold text-hero uppercase hover:bg-white/90">
            <FileText data-icon="inline-start" />
            Lưu và xuất PDF
          </Button>
        }
      />

      <div className="mx-auto grid max-w-7xl items-start gap-5 px-4 pt-8 pb-16 sm:px-6 lg:grid-cols-[minmax(0,1fr)_400px] lg:px-8">
        <form onSubmit={handleSubmit} className="grid min-w-0 gap-5">
          {cv.parse_status === "failed" ? (
            <p role="alert" className="rounded-md border border-warning/30 bg-warning-soft px-3 py-2.5 text-sm text-warning">
              {cv.parse_error ?? "Không đọc được nội dung file."} Bạn vẫn có thể tự điền CV trên form này.
            </p>
          ) : (
            cv.source === "upload" && (
              <p className="rounded-md border border-info/30 bg-info-soft px-3 py-2.5 text-sm text-info">
                Nội dung được đọc tự động từ file {cv.file_name}, có thể chưa chính xác. Hãy kiểm tra lại từng mục rồi lưu.
              </p>
            )
          )}

          <Card className="p-5 sm:p-6">
            <FormField id="cv-title" label="Tên CV" hint="Chỉ bạn nhìn thấy tên này, dùng để phân biệt các CV.">
              <Input id="cv-title" className="h-11" maxLength={150} value={title} onChange={(e) => setTitle(e.target.value)} />
            </FormField>
          </Card>

          <CvForm value={content} onChange={setContent} />

          <FormError message={error} />
          <div className="sticky bottom-0 z-10 flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-card p-3">
            <span className="text-[13px] text-muted-foreground">{dirty ? "Có thay đổi chưa lưu" : "Đã lưu mọi thay đổi"}</span>
            <Button type="submit" disabled={updateCv.isPending || !dirty} className="h-11 px-6 font-bold uppercase">
              <Save data-icon="inline-start" />
              {updateCv.isPending ? "Đang lưu…" : "Lưu CV"}
            </Button>
          </div>
        </form>

        <aside className="lg:sticky lg:top-22 lg:max-h-[calc(100svh-6.5rem)] lg:overflow-y-auto">
          <EvaluationPanel cvId={cv.id} initialJobId={initialJobId} onBeforeEvaluate={save} />
        </aside>
      </div>
    </main>
  )
}

export function CvEditPage() {
  const { id } = useParams()
  const cvId = Number(id)
  const [params] = useSearchParams()
  const { data: cv, error, isLoading } = useCv(cvId)

  if (isLoading) {
    return (
      <main>
        <div className="h-48 bg-hero" />
        <div className="mx-auto grid max-w-7xl gap-5 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_400px] lg:px-8">
          <Skeleton className="h-96 rounded-lg" />
          <Skeleton className="h-72 rounded-lg" />
        </div>
      </main>
    )
  }
  if (error || !cv) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16">
        {error instanceof ApiError && error.status === 404 ? (
          <EmptyState
            title="Không tìm thấy CV"
            description="CV có thể đã bị xóa hoặc đường dẫn không đúng."
            action={
              <ButtonLink to="/cv" className="h-11 px-5 font-bold uppercase">
                Về danh sách CV
              </ButtonLink>
            }
          />
        ) : (
          <ErrorState error={error} />
        )}
      </main>
    )
  }
  return <CvEditor key={cv.id} cv={cv} initialJobId={Number(params.get("viec")) || undefined} />
}
