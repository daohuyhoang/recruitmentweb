import { ChevronRight } from "lucide-react"
import type { ReactNode } from "react"
import { Link } from "react-router-dom"

type PageBannerProps = {
  title: string
  description?: ReactNode
  breadcrumb?: { to?: string; label: string }[]
  actions?: ReactNode
}

// Dải tiêu đề đầu mỗi trang con, nền xanh đậm như hero trang chủ
export function PageBanner({ title, description, breadcrumb, actions }: PageBannerProps) {
  return (
    <section className="bg-hero bg-dots text-hero-foreground">
      <div className="mx-auto flex max-w-7xl flex-wrap items-end justify-between gap-6 px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
        <div>
          {breadcrumb && (
            <nav aria-label="Đường dẫn" className="mb-3 flex flex-wrap items-center gap-1.5 text-sm opacity-80">
              {breadcrumb.map((item, index) => (
                <span key={item.label} className="flex items-center gap-1.5">
                  {index > 0 && <ChevronRight className="size-3.5" aria-hidden="true" />}
                  {item.to ? (
                    <Link to={item.to} className="hover:underline">
                      {item.label}
                    </Link>
                  ) : (
                    <span aria-current="page">{item.label}</span>
                  )}
                </span>
              ))}
            </nav>
          )}
          <h1 className="text-[28px] font-bold leading-tight sm:text-[34px]">{title}</h1>
          {description && <p className="mt-2 max-w-2xl opacity-85">{description}</p>}
        </div>
        {actions}
      </div>
    </section>
  )
}
