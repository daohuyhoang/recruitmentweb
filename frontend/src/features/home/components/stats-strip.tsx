import { usePublicStats } from "@/features/catalog/queries"
import { formatNumber } from "@/lib/format"

const ITEMS = [
  { key: "open_jobs", label: "Việc làm đang tuyển" },
  { key: "companies", label: "Công ty đã xác thực" },
  { key: "candidates", label: "Ứng viên đã đăng ký" },
]

export function StatsStrip() {
  const { data } = usePublicStats()
  return (
    <section className="border-b bg-muted">
      <div className="mx-auto grid max-w-7xl items-center gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_1.4fr] lg:px-8">
        <div>
          <h2 className="text-2xl font-bold">KhớpViệc qua những con số</h2>
          <p className="mt-3 max-w-md leading-relaxed text-muted-foreground">
            Tin tuyển dụng được kiểm duyệt trước khi đăng, công ty được xác thực trước khi tuyển.
          </p>
        </div>
        <dl className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {ITEMS.map((item) => (
            <div key={item.key} className="flex flex-col-reverse">
              <dt className="mt-1 font-semibold">{item.label}</dt>
              <dd className="font-heading text-[44px] font-bold leading-none text-brand tabular-nums">
                {data ? formatNumber(data[item.key]) : "–"}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}
