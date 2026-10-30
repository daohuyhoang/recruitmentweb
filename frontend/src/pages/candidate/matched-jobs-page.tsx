import { useState } from "react"
import { ButtonLink } from "@/components/common/button-link"
import { EmptyState, ErrorState } from "@/components/common/states"
import { PageBanner } from "@/components/layout/page-banner"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { useCities } from "@/features/catalog/queries"
import { useMyCvs } from "@/features/jobs/queries"
import { MatchDetail } from "@/features/matching/components/match-detail"
import { MatchListItem } from "@/features/matching/components/match-list-item"
import { useTopMatches } from "@/features/matching/queries"
import { ApiError } from "@/lib/api"

const SALARIES = [
  { value: "0", label: "Mọi mức lương" },
  { value: "10", label: "Từ 10 triệu" },
  { value: "15", label: "Từ 15 triệu" },
  { value: "20", label: "Từ 20 triệu" },
]

export function MatchedJobsPage() {
  const { data: cvs } = useMyCvs()
  const { data: cities = [] } = useCities()
  const [cvId, setCvId] = useState<string>("")
  const [cityId, setCityId] = useState("all")
  const [minSalary, setMinSalary] = useState("0")
  const [selectedId, setSelectedId] = useState<number | null>(null)

  const { data, error, isLoading, isFetching } = useTopMatches({
    cv_id: cvId ? Number(cvId) : undefined,
    city_id: cityId === "all" ? undefined : Number(cityId),
    salary_min: Number(minSalary) || undefined,
  })
  const matches = data?.items ?? []
  const selected = matches.find((m) => m.job.id === selectedId) ?? matches[0]

  const cvOptions = (cvs ?? []).map((cv) => ({ value: String(cv.id), label: cv.title + (cv.is_default ? " (CV chính)" : "") }))
  const cityOptions = [{ value: "all", label: "Tất cả địa điểm" }, ...cities.map((c) => ({ value: String(c.id), label: c.name }))]
  const noCv = error instanceof ApiError && error.status === 404

  return (
    <main>
      <PageBanner
        title="Việc làm phù hợp với CV của bạn"
        breadcrumb={[{ to: "/", label: "Trang chủ" }, { label: "Việc phù hợp" }]}
        description={
          data ? (
            <>
              So khớp <span className="font-semibold">{data.cv.title}</span> với các tin đang mở bằng 3 thuật toán và tiêu chí kinh nghiệm,
              học vấn, địa điểm.
            </>
          ) : (
            "Hệ thống so khớp CV với từng tin tuyển dụng và xếp hạng 10 việc phù hợp nhất."
          )
        }
      />

      <div className="mx-auto max-w-7xl px-4 pt-8 pb-16 sm:px-6 lg:px-8">
        {noCv ? (
          <EmptyState
            title="Bạn chưa có CV"
            description="Hãy tải CV lên hoặc tạo CV mới để hệ thống gợi ý việc phù hợp."
            action={
              <ButtonLink to="/viec-lam" className="h-11 px-5 font-bold uppercase">
                Xem việc làm
              </ButtonLink>
            }
          />
        ) : (
          <>
            {data && (
              <Card size="sm" className="flex-row flex-wrap items-center gap-x-4 gap-y-3 px-4">
                <span className="text-[13px] font-medium text-muted-foreground">Kỹ năng đọc được từ CV</span>
                <div className="flex flex-wrap gap-1.5">
                  {data.cv.skills.map((skill) => (
                    <Badge key={skill.skill_id} variant="outline" className="h-6 rounded-sm bg-muted px-2 text-[13px] font-normal">
                      {skill.name}
                    </Badge>
                  ))}
                </div>
              </Card>
            )}

            <div className="my-4 flex flex-wrap items-center gap-3">
              {cvOptions.length > 1 && (
                <Select items={cvOptions} value={cvId || String(data?.cv.id ?? "")} onValueChange={(v) => setCvId(v ?? "")}>
                  <SelectTrigger className="h-9 min-w-52 bg-card" aria-label="CV dùng để so khớp">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {cvOptions.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <Select items={cityOptions} value={cityId} onValueChange={(v) => setCityId(v ?? "all")}>
                <SelectTrigger className="h-9 min-w-44 bg-card" aria-label="Địa điểm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {cityOptions.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select items={SALARIES} value={minSalary} onValueChange={(v) => setMinSalary(v ?? "0")}>
                <SelectTrigger className="h-9 min-w-40 bg-card" aria-label="Mức lương">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SALARIES.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="w-full text-[13px] text-muted-foreground tabular-nums sm:ml-auto sm:w-auto">
                {isFetching ? "Đang tính điểm…" : `${matches.length} việc · xếp theo điểm phù hợp`}
              </span>
            </div>

            {error && !noCv ? (
              <ErrorState error={error} />
            ) : (
              <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_400px]">
                <Card className="gap-0 py-0">
                  {isLoading ? (
                    <div className="grid gap-px">
                      {Array.from({ length: 6 }, (_, i) => (
                        <Skeleton key={i} className="h-24 rounded-none" />
                      ))}
                    </div>
                  ) : matches.length === 0 ? (
                    <p className="px-5 py-8 text-sm text-muted-foreground">
                      Không có việc nào khớp bộ lọc. Thử bỏ bớt điều kiện địa điểm hoặc mức lương.
                    </p>
                  ) : (
                    <ol aria-label="Danh sách việc làm xếp theo độ phù hợp" className="divide-y">
                      {matches.map((match, index) => (
                        <li key={match.job.id}>
                          <MatchListItem
                            match={match}
                            rank={index + 1}
                            selected={match.job.id === selected?.job.id}
                            onSelect={() => setSelectedId(match.job.id)}
                          />
                        </li>
                      ))}
                    </ol>
                  )}
                </Card>
                <aside aria-live="polite" className="lg:sticky lg:top-22">
                  {selected && <MatchDetail match={selected} />}
                </aside>
              </div>
            )}
            {data && !data.semantic_available && (
              <p className="mt-4 text-[13px] text-muted-foreground">
                Thuật toán 3 (Sentence-BERT) chưa sẵn sàng, điểm đang tính từ 3 thành phần còn lại.
              </p>
            )}
          </>
        )}
      </div>
    </main>
  )
}
