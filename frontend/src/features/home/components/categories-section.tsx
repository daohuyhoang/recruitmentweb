import { Calculator, GraduationCap, Handshake, HardHat, Laptop, Megaphone, Users, type LucideIcon } from "lucide-react"
import { Link } from "react-router-dom"

import { SectionHeading } from "@/components/layout/section-heading"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useCategories } from "@/features/catalog/queries"

// Tên icon lưu trong cột categories.icon
const ICONS: Record<string, LucideIcon> = {
  laptop: Laptop,
  calculator: Calculator,
  handshake: Handshake,
  megaphone: Megaphone,
  "hard-hat": HardHat,
  "graduation-cap": GraduationCap,
  users: Users,
}

export function CategoriesSection() {
  const { data: categories, isLoading } = useCategories()
  return (
    <section className="bg-muted">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
        <SectionHeading
          align="center"
          title="Ngành nghề đang tuyển"
          description="Chọn ngành để xem việc làm đang mở, hoặc để hệ thống tự tìm việc phù hợp với CV của bạn trong mọi ngành."
        />
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {isLoading && Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-64 rounded-lg bg-card" />)}
          {categories?.map((category) => {
            const Icon = ICONS[category.icon ?? ""] ?? Laptop
            return (
              <Card
                key={category.id}
                className="group relative items-center gap-0 px-8 py-10 text-center transition-shadow hover:shadow-md"
              >
                <span className="grid size-20 place-items-center rounded-full bg-brand text-white transition-transform group-hover:scale-105">
                  <Icon className="size-9" aria-hidden="true" />
                </span>
                <h3 className="mt-6 text-lg font-bold">
                  <Link to={`/viec-lam?nganh=${category.id}`} className="after:absolute after:inset-0 group-hover:text-primary">
                    {category.name}
                  </Link>
                </h3>
                <p className="mt-3 leading-relaxed text-muted-foreground">{category.description}</p>
                <p className="mt-4 text-sm font-semibold text-primary tabular-nums">{category.open_jobs} việc đang tuyển</p>
              </Card>
            )
          })}
        </div>
      </div>
    </section>
  )
}
