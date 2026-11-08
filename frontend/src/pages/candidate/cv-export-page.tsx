import { ArrowLeft, Printer } from "lucide-react"
import { useEffect, type ReactNode } from "react"
import { useParams } from "react-router-dom"

import { ButtonLink } from "@/components/common/button-link"
import { EmptyState, ErrorState } from "@/components/common/states"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useCv } from "@/features/cv/queries"
import { formatPeriod } from "@/lib/format"
import type { CvContent } from "@/types/api"

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-6 break-inside-avoid-page">
      <h2 className="border-b pb-1 text-[13px] font-bold tracking-wide text-primary uppercase">{title}</h2>
      <div className="mt-3 grid gap-3 text-sm leading-relaxed">{children}</div>
    </section>
  )
}

function Entry({ title, subtitle, period, text }: { title: string; subtitle?: string; period?: string; text?: string }) {
  return (
    <div className="break-inside-avoid">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4">
        <p className="font-semibold">{title}</p>
        {period && <p className="text-[13px] text-muted-foreground tabular-nums">{period}</p>}
      </div>
      {subtitle && <p className="text-muted-foreground">{subtitle}</p>}
      {text && <p className="mt-1 whitespace-pre-line">{text}</p>}
    </div>
  )
}

function CvSheet({ content }: { content: CvContent }) {
  const { personal } = content
  const contact = [personal.email, personal.phone, personal.address].filter(Boolean).join(" · ")
  return (
    <article className="mx-auto w-full max-w-[210mm] rounded-lg border bg-card p-6 sm:p-[14mm] print:max-w-none print:rounded-none print:border-0 print:p-0">
      <header>
        <h1 className="text-[28px] leading-tight font-bold">{personal.full_name}</h1>
        {personal.headline && <p className="mt-1 text-base font-semibold text-primary">{personal.headline}</p>}
        {contact && <p className="mt-2 text-[13px] text-muted-foreground">{contact}</p>}
      </header>

      {content.objective && (
        <Block title="Mục tiêu nghề nghiệp">
          <p className="whitespace-pre-line">{content.objective}</p>
        </Block>
      )}
      {content.experiences.length > 0 && (
        <Block title="Kinh nghiệm làm việc">
          {content.experiences.map((item, index) => (
            <Entry key={index} title={item.position} subtitle={item.company} period={formatPeriod(item.start, item.end)} text={item.description} />
          ))}
        </Block>
      )}
      {content.projects.length > 0 && (
        <Block title="Dự án">
          {content.projects.map((item, index) => (
            <Entry key={index} title={item.name} subtitle={item.role} period={formatPeriod(item.start, item.end)} text={[item.description, item.link].filter(Boolean).join("\n")} />
          ))}
        </Block>
      )}
      {content.educations.length > 0 && (
        <Block title="Học vấn">
          {content.educations.map((item, index) => (
            <Entry
              key={index}
              title={item.school}
              subtitle={[item.major, item.degree, item.gpa && `Điểm trung bình ${item.gpa}`].filter(Boolean).join(" · ")}
              period={formatPeriod(item.start, item.end)}
            />
          ))}
        </Block>
      )}
      {content.skills.length > 0 && (
        <Block title="Kỹ năng">
          <div className="flex flex-wrap gap-1.5">
            {content.skills.map((skill) => (
              <Badge key={skill} variant="outline" className="h-6 rounded-sm px-2 text-[13px] font-normal">
                {skill}
              </Badge>
            ))}
          </div>
        </Block>
      )}
      {content.certificates.length > 0 && (
        <Block title="Chứng chỉ">
          {content.certificates.map((item, index) => (
            <Entry key={index} title={item.name} subtitle={item.issuer} period={item.year ? String(item.year) : undefined} />
          ))}
        </Block>
      )}
      {content.strengths && (
        <Block title="Điểm mạnh">
          <p className="whitespace-pre-line">{content.strengths}</p>
        </Block>
      )}
    </article>
  )
}

/** Xuất CV bằng hộp thoại in của trình duyệt (chọn đích Lưu thành PDF). Luôn hiển thị giao diện sáng để in đúng màu. */
export function CvExportPage() {
  const { id } = useParams()
  const cvId = Number(id)
  const { data: cv, error, isLoading } = useCv(cvId)

  useEffect(() => {
    const root = document.documentElement
    const wasDark = root.classList.contains("dark")
    root.classList.remove("dark")
    return () => {
      root.classList.toggle("dark", wasDark)
    }
  }, [])

  // Trình duyệt lấy tiêu đề trang làm tên file PDF mặc định
  const fileTitle = cv?.title
  useEffect(() => {
    if (!fileTitle) return
    const previous = document.title
    document.title = fileTitle
    return () => {
      document.title = previous
    }
  }, [fileTitle])

  return (
    <div className="min-h-svh bg-muted px-4 py-6 print:bg-background print:p-0">
      <div className="mx-auto mb-4 flex max-w-[210mm] flex-wrap items-center justify-between gap-3 print:hidden">
        <ButtonLink to={`/cv/${cvId}`} variant="outline" className="h-11 px-4">
          <ArrowLeft data-icon="inline-start" />
          Quay lại sửa CV
        </ButtonLink>
        <Button onClick={() => window.print()} disabled={!cv?.content} className="h-11 px-6 font-bold uppercase">
          <Printer data-icon="inline-start" />
          Lưu thành PDF
        </Button>
      </div>

      {isLoading ? (
        <Skeleton className="mx-auto h-[297mm] max-w-[210mm] rounded-lg" />
      ) : error ? (
        <div className="mx-auto max-w-[210mm]">
          <ErrorState error={error} />
        </div>
      ) : cv?.content ? (
        <CvSheet content={cv.content} />
      ) : (
        <div className="mx-auto max-w-[210mm]">
          <EmptyState title="CV chưa có nội dung" description="Hãy quay lại, điền CV trên form và lưu trước khi xuất PDF." />
        </div>
      )}
    </div>
  )
}
