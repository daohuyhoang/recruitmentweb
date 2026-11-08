import { Download, FileText, PencilLine, Plus, Star, Trash2, Upload } from "lucide-react"
import { useRef, useState, type ChangeEvent } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"

import { ButtonLink } from "@/components/common/button-link"
import { ConfirmDialog } from "@/components/common/confirm-dialog"
import { EmptyState, ErrorState } from "@/components/common/states"
import { PageBanner } from "@/components/layout/page-banner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { NewCvDialog } from "@/features/cv/components/new-cv-dialog"
import { useDeleteCv, useSetDefaultCv, useUploadCv } from "@/features/cv/queries"
import { useMyCvs } from "@/features/jobs/queries"
import { api } from "@/lib/api"
import { formatDate, formatFileSize } from "@/lib/format"
import type { Cv } from "@/types/api"

const VISIBLE_SKILLS = 8

function CvRow({ cv, onDelete }: { cv: Cv; onDelete: () => void }) {
  const setDefault = useSetDefaultCv()
  const meta = [
    cv.source === "upload" ? "Tải lên" : "Tạo bằng form",
    cv.file_name && `${cv.file_name}${cv.file_size ? ` (${formatFileSize(cv.file_size)})` : ""}`,
    `Sửa ngày ${formatDate(cv.updated_at)}`,
  ].filter(Boolean)

  function handleDownload() {
    api.download(`/candidate/cvs/${cv.id}/file`, cv.file_name ?? "cv").catch((err: Error) => toast.error(err.message))
  }

  function handleSetDefault() {
    setDefault.mutate(cv.id, {
      onSuccess: (result) => toast.success(result.message),
      onError: (err) => toast.error(err.message),
    })
  }

  return (
    <li className="grid gap-4 p-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-lg font-bold leading-snug">{cv.title}</h2>
          {cv.is_default && <Badge variant="info">CV chính</Badge>}
          {cv.parse_status === "failed" && <Badge variant="danger">Chưa đọc được file</Badge>}
        </div>
        <p className="mt-1 text-[13px] text-muted-foreground">{meta.join(" · ")}</p>
        {cv.skills.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {cv.skills.slice(0, VISIBLE_SKILLS).map((skill) => (
              <Badge key={skill.skill_id} variant="outline" className="h-6 rounded-sm bg-muted px-2 text-[13px] font-normal">
                {skill.name}
              </Badge>
            ))}
            {cv.skills.length > VISIBLE_SKILLS && (
              <span className="self-center text-[13px] text-muted-foreground tabular-nums">+{cv.skills.length - VISIBLE_SKILLS} kỹ năng</span>
            )}
          </div>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">Chưa nhận ra kỹ năng nào. Mở CV và thêm ở mục Kỹ năng để được so khớp.</p>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2 lg:justify-end">
        <ButtonLink to={`/cv/${cv.id}`} className="h-10 px-4 font-bold uppercase">
          <PencilLine data-icon="inline-start" />
          Sửa và đánh giá
        </ButtonLink>
        <ButtonLink to={`/cv/${cv.id}/xuat-pdf`} variant="outline" className="h-10 px-3">
          <FileText data-icon="inline-start" />
          Xuất PDF
        </ButtonLink>
        {!cv.is_default && (
          <Button type="button" variant="outline" className="h-10 px-3" disabled={setDefault.isPending} onClick={handleSetDefault}>
            <Star data-icon="inline-start" />
            Đặt làm CV chính
          </Button>
        )}
        {cv.source === "upload" && (
          <Button type="button" variant="ghost" size="icon-lg" aria-label={`Tải file gốc của ${cv.title}`} onClick={handleDownload}>
            <Download />
          </Button>
        )}
        <Button type="button" variant="ghost" size="icon-lg" aria-label={`Xóa ${cv.title}`} onClick={onDelete}>
          <Trash2 />
        </Button>
      </div>
    </li>
  )
}

export function CvListPage() {
  const navigate = useNavigate()
  const { data: cvs, error, isLoading } = useMyCvs()
  const upload = useUploadCv()
  const removeCv = useDeleteCv()
  const fileInput = useRef<HTMLInputElement>(null)
  const [newOpen, setNewOpen] = useState(false)
  const [deleting, setDeleting] = useState<Cv | null>(null)

  function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = "" // cho phép chọn lại đúng file đó nếu lần trước lỗi
    if (!file) return
    upload.mutate(file, {
      onSuccess: (cv) => navigate(`/cv/${cv.id}`),
      onError: (err) => toast.error(err.message),
    })
  }

  function handleDelete() {
    if (!deleting) return
    removeCv.mutate(deleting.id, {
      onSuccess: () => {
        setDeleting(null)
        toast.success("Đã xóa CV")
      },
      onError: (err) => {
        setDeleting(null)
        toast.error(err.message)
      },
    })
  }

  const startUpload = () => fileInput.current?.click()

  return (
    <main>
      <PageBanner
        title="CV của tôi"
        breadcrumb={[{ to: "/", label: "Trang chủ" }, { label: "CV của tôi" }]}
        description="Tải CV PDF hoặc DOCX lên, hoặc tạo CV trên form. CV chính được dùng mặc định để gợi ý việc làm."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button onClick={startUpload} disabled={upload.isPending} className="h-11 bg-white px-5 font-bold text-hero uppercase hover:bg-white/90">
              <Upload data-icon="inline-start" />
              {upload.isPending ? "Đang đọc file…" : "Tải CV lên"}
            </Button>
            <Button
              variant="outline"
              onClick={() => setNewOpen(true)}
              className="h-11 border-hero-foreground/40 bg-transparent px-4 font-bold text-hero-foreground uppercase hover:bg-hero-foreground hover:text-hero dark:bg-transparent"
            >
              <Plus data-icon="inline-start" />
              Tạo CV mới
            </Button>
          </div>
        }
      />
      <input ref={fileInput} type="file" accept=".pdf,.docx" className="sr-only" tabIndex={-1} aria-label="Chọn file CV" onChange={handleFile} />

      <div className="mx-auto max-w-7xl px-4 pt-8 pb-16 sm:px-6 lg:px-8">
        {error ? (
          <ErrorState error={error} />
        ) : isLoading ? (
          <Skeleton className="h-64 rounded-lg" />
        ) : !cvs?.length ? (
          <EmptyState
            title="Bạn chưa có CV"
            description="Tải file CV lên để hệ thống tự đọc nội dung, hoặc tạo CV mới trên form."
            action={
              <Button onClick={startUpload} disabled={upload.isPending} className="h-11 px-5 font-bold uppercase">
                <Upload data-icon="inline-start" />
                Tải CV lên
              </Button>
            }
          />
        ) : (
          <Card className="gap-0 py-0">
            <ul className="divide-y">
              {cvs.map((cv) => (
                <CvRow key={cv.id} cv={cv} onDelete={() => setDeleting(cv)} />
              ))}
            </ul>
          </Card>
        )}
      </div>

      {newOpen && <NewCvDialog open onOpenChange={setNewOpen} />}
      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Xóa CV này?"
        description={`"${deleting?.title ?? ""}" sẽ biến mất khỏi danh sách của bạn. Hồ sơ đã nộp bằng CV này vẫn được giữ cho nhà tuyển dụng.`}
        confirmLabel="Xóa CV"
        pending={removeCv.isPending}
        onConfirm={handleDelete}
      />
    </main>
  )
}
