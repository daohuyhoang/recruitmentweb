import { CircleCheck } from "lucide-react"
import type { ReactNode } from "react"

const POINTS = [
  "Gợi ý 10 việc phù hợp nhất với CV của bạn",
  "Biết kỹ năng nào đã đáp ứng, kỹ năng nào còn thiếu",
  "Theo dõi trạng thái từng hồ sơ đã nộp",
]

export function AuthLayout({ title, description, children }: { title: string; description: ReactNode; children: ReactNode }) {
  return (
    <main className="grid min-h-[calc(100svh-4.5rem)] lg:grid-cols-[1fr_1.1fr]">
      <section className="hidden bg-hero bg-dots px-12 py-16 text-hero-foreground lg:flex lg:flex-col lg:justify-center">
        <div className="ml-auto w-full max-w-md">
          <h2 className="text-[34px] font-bold leading-tight">Tìm việc đúng với năng lực của bạn</h2>
          <span aria-hidden="true" className="mt-6 block h-1 w-20 rounded-full bg-brand" />
          <ul className="mt-8 grid gap-4">
            {POINTS.map((point) => (
              <li key={point} className="flex gap-3">
                <CircleCheck className="mt-0.5 size-5 shrink-0 text-brand" aria-hidden="true" />
                <span className="opacity-90">{point}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
      <section className="flex items-center justify-center px-4 py-12 sm:px-6">
        <div className="w-full max-w-md">
          <h1 className="text-[28px] font-bold">{title}</h1>
          <p className="mt-2 text-muted-foreground">{description}</p>
          <div className="mt-8">{children}</div>
        </div>
      </section>
    </main>
  )
}
