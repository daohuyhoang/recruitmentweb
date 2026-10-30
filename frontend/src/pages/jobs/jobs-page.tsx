import { Award, BriefcaseBusiness, CalendarClock, MapPin, Search } from "lucide-react"
import { useEffect, useState, type FormEvent, type ReactNode } from "react"
import { Link, useSearchParams } from "react-router-dom"

import { Pager } from "@/components/common/pager"
import { EmptyState, ErrorState } from "@/components/common/states"
import { PageBanner } from "@/components/layout/page-banner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { useCategories, useCities } from "@/features/catalog/queries"
import { useJobs, type JobFilters } from "@/features/jobs/queries"
import { daysUntil, formatDate, formatExperience, formatSalary, timeAgo } from "@/lib/format"
import { EMPLOYMENT_TYPE_LABELS, WORK_MODE_LABELS } from "@/lib/labels"
import { cn } from "@/lib/utils"
import type { JobSummary } from "@/types/api"

const PAGE_SIZE = 10

const SALARY_OPTIONS = [
  { value: "", label: "Mọi mức lương" },
  { value: "10", label: "Từ 10 triệu" },
  { value: "15", label: "Từ 15 triệu" },
  { value: "20", label: "Từ 20 triệu" },
  { value: "30", label: "Từ 30 triệu" },
]

const SORT_OPTIONS = [
  { value: "newest", label: "Mới nhất" },
  { value: "salary", label: "Lương cao nhất" },
  { value: "deadline", label: "Sắp hết hạn" },
]

// Tên tham số trên URL (tiếng Việt không dấu) ↔ tham số API
const PARAM = { q: "q", category: "nganh", city: "tinh", type: "loai", mode: "hinh-thuc", salary: "luong", sort: "sap-xep", page: "trang" }

function FilterGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="grid gap-3 border-t p-5 first:border-t-0">
      <legend className="float-left mb-1 w-full text-sm font-bold">{title}</legend>
      {children}
    </fieldset>
  )
}

function RadioList({
  name,
  value,
  options,
  onChange,
}: {
  name: string
  value: string
  options: { value: string; label: string; count?: number }[]
  onChange: (value: string) => void
}) {
  return (
    <RadioGroup value={value} onValueChange={(v) => onChange(String(v))} className="gap-2.5">
      {options.map((o) => (
        <Label key={o.value} className="flex cursor-pointer items-center gap-2.5 font-normal">
          <RadioGroupItem value={o.value} aria-label={o.label} id={`${name}-${o.value || "all"}`} />
          <span className="flex-1">{o.label}</span>
          {o.count !== undefined && <span className="text-[13px] text-muted-foreground tabular-nums">{o.count}</span>}
        </Label>
      ))}
    </RadioGroup>
  )
}

function JobRow({ job }: { job: JobSummary }) {
  const daysLeft = daysUntil(job.deadline)
  return (
    <Card className="group relative gap-0 p-5 transition-shadow hover:shadow-md sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-2">
        <div className="min-w-0">
          <h3 className="text-lg font-bold leading-snug">
            <Link to={`/viec-lam/${job.id}`} className="after:absolute after:inset-0 group-hover:text-primary">
              {job.title}
            </Link>
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {job.company.name} · {job.category.name}
          </p>
        </div>
        <p className="font-semibold text-primary tabular-nums">{formatSalary(job.salary_min, job.salary_max)}</p>
      </div>
      <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-muted-foreground [&_li]:flex [&_li]:items-center [&_li]:gap-1.5 [&_svg]:size-4 [&_svg]:text-primary">
        <li>
          <MapPin aria-hidden="true" />
          {job.city.name}
        </li>
        <li>
          <BriefcaseBusiness aria-hidden="true" />
          {EMPLOYMENT_TYPE_LABELS[job.employment_type]} · {WORK_MODE_LABELS[job.work_mode]}
        </li>
        <li>
          <Award aria-hidden="true" />
          {formatExperience(job.experience_min_years, job.experience_max_years)}
        </li>
        <li className={cn(daysLeft <= 7 && "font-medium text-warning")}>
          <CalendarClock aria-hidden="true" />
          {daysLeft <= 7 ? `Còn ${daysLeft} ngày` : `Hạn ${formatDate(job.deadline)}`}
        </li>
      </ul>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t pt-4">
        <div className="flex flex-wrap gap-1.5">
          {job.skills.slice(0, 6).map((s) => (
            <Badge
              key={s.skill_id}
              variant="outline"
              className={cn("h-6 rounded-sm px-2 text-[13px] font-normal", s.required ? "bg-muted" : "text-muted-foreground")}
            >
              {s.name}
            </Badge>
          ))}
        </div>
        <span className="text-[13px] text-muted-foreground">{timeAgo(job.published_at)}</span>
      </div>
    </Card>
  )
}

export function JobsPage() {
  const [params, setParams] = useSearchParams()
  const { data: categories = [] } = useCategories()
  const { data: cities = [] } = useCities()
  const [keyword, setKeyword] = useState(params.get(PARAM.q) ?? "")

  useEffect(() => setKeyword(params.get(PARAM.q) ?? ""), [params])

  const page = Number(params.get(PARAM.page)) || 1
  const filters: JobFilters = {
    q: params.get(PARAM.q) || undefined,
    category_id: Number(params.get(PARAM.category)) || undefined,
    city_id: Number(params.get(PARAM.city)) || undefined,
    employment_type: params.get(PARAM.type) || undefined,
    work_mode: params.get(PARAM.mode) || undefined,
    salary_min: Number(params.get(PARAM.salary)) || undefined,
    sort: (params.get(PARAM.sort) as JobFilters["sort"]) || "newest",
    page,
    size: PAGE_SIZE,
  }
  const { data, isLoading, error, isFetching } = useJobs(filters)

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    if (key !== PARAM.page) next.delete(PARAM.page)
    setParams(next)
  }

  function handleSearch(event: FormEvent) {
    event.preventDefault()
    setParam(PARAM.q, keyword.trim())
  }

  const cityOptions = [{ value: "all", label: "Tất cả địa điểm" }, ...cities.map((c) => ({ value: String(c.id), label: c.name }))]
  const hasFilters = [...params.keys()].some((k) => k !== PARAM.sort && k !== PARAM.page)

  return (
    <main>
      <PageBanner
        title="Tìm việc làm"
        breadcrumb={[{ to: "/", label: "Trang chủ" }, { label: "Việc làm" }]}
        description="Tin tuyển dụng đã được kiểm duyệt và còn hạn nộp hồ sơ."
      />
      <div className="mx-auto grid max-w-7xl items-start gap-6 px-4 pt-8 pb-16 sm:px-6 lg:grid-cols-[280px_minmax(0,1fr)] lg:px-8">
        <aside className="lg:sticky lg:top-22">
          <Card className="gap-0 py-0">
            <form onSubmit={handleSearch} className="border-b p-5">
              <Label htmlFor="job-keyword" className="mb-3 block text-sm font-bold">
                Từ khóa
              </Label>
              <div className="flex gap-2">
                <Input
                  id="job-keyword"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="Chức danh, kỹ năng, công ty"
                  className="h-10"
                />
                <Button type="submit" size="icon-lg" className="size-10 shrink-0" aria-label="Tìm">
                  <Search />
                </Button>
              </div>
            </form>
            <FilterGroup title="Ngành nghề">
              <RadioList
                name="category"
                value={params.get(PARAM.category) ?? ""}
                onChange={(v) => setParam(PARAM.category, v)}
                options={[
                  { value: "", label: "Tất cả" },
                  ...categories.map((c) => ({ value: String(c.id), label: c.name, count: c.open_jobs })),
                ]}
              />
            </FilterGroup>
            <FilterGroup title="Địa điểm">
              <Select
                items={cityOptions}
                value={params.get(PARAM.city) ?? "all"}
                onValueChange={(v) => setParam(PARAM.city, !v || v === "all" ? "" : v)}
              >
                <SelectTrigger className="h-10 w-full" aria-label="Địa điểm">
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
            </FilterGroup>
            <FilterGroup title="Loại hình">
              <RadioList
                name="type"
                value={params.get(PARAM.type) ?? ""}
                onChange={(v) => setParam(PARAM.type, v)}
                options={[
                  { value: "", label: "Tất cả" },
                  ...Object.entries(EMPLOYMENT_TYPE_LABELS).map(([value, label]) => ({ value, label })),
                ]}
              />
            </FilterGroup>
            <FilterGroup title="Mức lương">
              <RadioList
                name="salary"
                value={params.get(PARAM.salary) ?? ""}
                onChange={(v) => setParam(PARAM.salary, v)}
                options={SALARY_OPTIONS}
              />
            </FilterGroup>
            {hasFilters && (
              <div className="border-t p-5">
                <Button variant="outline" className="h-10 w-full" onClick={() => setParams(new URLSearchParams())}>
                  Xóa bộ lọc
                </Button>
              </div>
            )}
          </Card>
        </aside>

        <section aria-label="Kết quả tìm kiếm" className="grid gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-muted-foreground">
              {isLoading ? (
                "Đang tải…"
              ) : (
                <>
                  Tìm thấy <strong className="font-semibold text-foreground tabular-nums">{data?.total ?? 0}</strong> việc làm
                  {filters.q && (
                    <>
                      {" "}
                      cho “<strong className="font-semibold text-foreground">{filters.q}</strong>”
                    </>
                  )}
                </>
              )}
            </p>
            <Select items={SORT_OPTIONS} value={filters.sort} onValueChange={(v) => setParam(PARAM.sort, v === "newest" ? "" : (v ?? ""))}>
              <SelectTrigger className="h-9 min-w-40 bg-card" aria-label="Sắp xếp">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {error ? (
            <ErrorState error={error} />
          ) : isLoading ? (
            Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-44 rounded-lg" />)
          ) : data && data.items.length > 0 ? (
            <div className={cn("grid gap-4 transition-opacity", isFetching && "opacity-60")}>
              {data.items.map((job) => (
                <JobRow key={job.id} job={job} />
              ))}
              <div className="pt-4">
                <Pager page={page} size={PAGE_SIZE} total={data.total} onChange={(p) => setParam(PARAM.page, p === 1 ? "" : String(p))} />
              </div>
            </div>
          ) : (
            <EmptyState
              title="Không tìm thấy việc làm phù hợp"
              description="Thử từ khóa ngắn hơn, bỏ bớt bộ lọc, hoặc tìm theo kỹ năng như “React”, “Kế toán”."
              action={
                hasFilters && (
                  <Button variant="outline" className="h-10" onClick={() => setParams(new URLSearchParams())}>
                    Xóa bộ lọc
                  </Button>
                )
              }
            />
          )}
        </section>
      </div>
    </main>
  )
}
