import { CircleCheck, Sparkles } from "lucide-react"
import { SectionHeading } from "@/components/layout/section-heading"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { ButtonLink } from "@/components/common/button-link"

const FEATURES = [
  { title: "Top 10 việc phù hợp", text: "Xếp hạng tin tuyển dụng theo độ khớp với CV, có giải thích vì sao." },
  { title: "Kỹ năng còn thiếu", text: "Với mỗi việc, biết ngay kỹ năng nào đã đáp ứng và kỹ năng nào cần bổ sung." },
  { title: "Gợi ý sửa CV", text: "Phát hiện phần còn thiếu hoặc viết chung chung, sửa trên form rồi xuất PDF." },
]

const PREVIEW_ROWS = [
  { label: "Kỹ năng khớp", value: 92 },
  { label: "Từ khóa", value: 64 },
  { label: "Ngữ nghĩa", value: 81 },
]

export function CvMatchPromo() {
  return (
    <section className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:px-8 lg:py-24">
      <div>
        <SectionHeading
          eyebrow="Gợi ý theo CV"
          title="Biết ngay mình hợp với việc nào"
          description="Thay vì đọc hàng trăm tin tuyển dụng, hãy để hệ thống đọc CV của bạn và so sánh với từng yêu cầu công việc."
        />
        <ul className="mt-8 grid gap-5">
          {FEATURES.map((feature) => (
            <li key={feature.title} className="flex gap-3.5">
              <CircleCheck className="mt-0.5 size-6 shrink-0 text-brand" aria-hidden="true" />
              <div>
                <p className="font-semibold">{feature.title}</p>
                <p className="mt-0.5 text-muted-foreground">{feature.text}</p>
              </div>
            </li>
          ))}
        </ul>
        <ButtonLink className="mt-9 h-12 px-6 font-bold uppercase" to="/viec-phu-hop">
          <Sparkles data-icon="inline-start" />
          Xem việc phù hợp với CV
        </ButtonLink>
      </div>

      {/* Minh họa kết quả thật của trang Việc phù hợp, thay cho ảnh */}
      <div className="relative rounded-lg bg-hero bg-dots p-6 sm:p-10">
        <Card className="gap-0 py-0 shadow-xl">
          <div className="flex items-start justify-between gap-4 border-b p-5">
            <div>
              <p className="font-heading text-lg font-bold">Frontend Developer (ReactJS)</p>
              <p className="mt-1 text-sm text-muted-foreground">Công ty CP Công nghệ Sao Mai · Hà Nội</p>
            </div>
            <div className="text-right">
              <p className="font-heading text-[40px] font-bold leading-none text-brand tabular-nums">84</p>
              <Badge variant="success" className="mt-2">
                Rất phù hợp
              </Badge>
            </div>
          </div>
          <dl className="grid gap-3.5 p-5">
            {PREVIEW_ROWS.map((row) => (
              <div key={row.label} className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-1.5">
                <dt className="text-sm">{row.label}</dt>
                <dd className="text-sm font-semibold tabular-nums">{row.value}%</dd>
                <Progress value={row.value} aria-label={row.label} className="col-span-2" />
              </div>
            ))}
          </dl>
          <div className="flex flex-wrap items-center gap-2 border-t p-5 text-sm">
            <span className="text-muted-foreground">Còn thiếu:</span>
            <Badge variant="warning">Jest</Badge>
          </div>
        </Card>
      </div>
    </section>
  )
}
