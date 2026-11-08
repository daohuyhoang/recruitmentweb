import { useState } from "react"
import { useSearchParams } from "react-router-dom"

import { ButtonLink } from "@/components/common/button-link"
import { Pager } from "@/components/common/pager"
import { SelectField } from "@/components/common/select-field"
import { EmptyState, ErrorState } from "@/components/common/states"
import { PageBanner } from "@/components/layout/page-banner"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { ApplicationDetail } from "@/features/applications/components/application-detail"
import { useMyApplications } from "@/features/applications/queries"
import { formatDate } from "@/lib/format"
import { APPLICATION_STATUS } from "@/lib/labels"
import { cn } from "@/lib/utils"
import type { ApplicationStatus } from "@/types/api"

const PAGE_SIZE = 10
const ALL = "all"
const STATUS_OPTIONS = [
  { value: ALL, label: "Tất cả trạng thái" },
  ...Object.entries(APPLICATION_STATUS).map(([value, item]) => ({ value, label: item.label })),
]

export function ApplicationsPage() {
  const [params] = useSearchParams()
  const [status, setStatus] = useState(ALL)
  const [page, setPage] = useState(1)
  const [selectedId, setSelectedId] = useState<number | null>(Number(params.get("ho-so")) || null)
  const { data, error, isLoading } = useMyApplications({
    page,
    size: PAGE_SIZE,
    status: status === ALL ? undefined : (status as ApplicationStatus),
  })
  const items = data?.items ?? []
  const selected = items.find((a) => a.id === selectedId) ?? items[0]

  function changeStatus(next: string) {
    setStatus(next)
    setPage(1)
    setSelectedId(null)
  }

  return (
    <main>
      <PageBanner
        title="Hồ sơ đã nộp"
        breadcrumb={[{ to: "/", label: "Trang chủ" }, { label: "Hồ sơ đã nộp" }]}
        description="Theo dõi trạng thái từng hồ sơ và lịch phỏng vấn nhà tuyển dụng đã hẹn."
      />

      <div className="mx-auto max-w-7xl px-4 pt-8 pb-16 sm:px-6 lg:px-8">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <SelectField value={status} onChange={changeStatus} options={STATUS_OPTIONS} aria-label="Lọc theo trạng thái" compact className="min-w-48" />
          {data && <span className="text-[13px] text-muted-foreground tabular-nums sm:ml-auto">{data.total} hồ sơ</span>}
        </div>

        {error ? (
          <ErrorState error={error} />
        ) : isLoading ? (
          <Skeleton className="h-96 rounded-lg" />
        ) : items.length === 0 ? (
          <EmptyState
            title={status === ALL ? "Bạn chưa nộp hồ sơ nào" : "Không có hồ sơ ở trạng thái này"}
            description={status === ALL ? "Tìm việc phù hợp rồi bấm Ứng tuyển ngay, hồ sơ sẽ hiện ở đây." : "Chọn Tất cả trạng thái để xem lại toàn bộ hồ sơ."}
            action={
              status === ALL ? (
                <ButtonLink to="/viec-phu-hop" className="h-11 px-5 font-bold uppercase">
                  Xem việc phù hợp
                </ButtonLink>
              ) : undefined
            }
          />
        ) : (
          <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_400px]">
            <div className="grid gap-6">
              <Card className="gap-0 py-0">
                <ul aria-label="Danh sách hồ sơ đã nộp" className="divide-y">
                  {items.map((application) => {
                    const isSelected = application.id === selected?.id
                    const state = APPLICATION_STATUS[application.status]
                    return (
                      <li key={application.id}>
                        <button
                          type="button"
                          aria-pressed={isSelected}
                          onClick={() => setSelectedId(application.id)}
                          className={cn(
                            "flex w-full items-center gap-4 border-l-3 border-l-transparent p-4 text-left transition-colors hover:bg-muted sm:px-5",
                            isSelected && "border-l-primary bg-accent hover:bg-accent",
                          )}
                        >
                          <span className="min-w-0 flex-1">
                            <span className="block font-semibold">{application.job.title}</span>
                            <span className="mt-0.5 block text-sm text-muted-foreground">{application.job.company.name}</span>
                            <span className="mt-1 block text-[13px] text-muted-foreground tabular-nums">Nộp ngày {formatDate(application.applied_at)}</span>
                          </span>
                          <Badge variant={state.variant}>{state.label}</Badge>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </Card>
              {data && <Pager page={page} size={PAGE_SIZE} total={data.total} onChange={setPage} />}
            </div>
            <aside aria-live="polite" className="lg:sticky lg:top-22">
              {selected && <ApplicationDetail key={selected.id} application={selected} />}
            </aside>
          </div>
        )}
      </div>
    </main>
  )
}
