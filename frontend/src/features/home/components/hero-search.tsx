import { LayoutGrid, MapPin, Search } from "lucide-react"
import { useState, type FormEvent } from "react"
import { Link, useNavigate } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useCategories, useCities, usePublicStats } from "@/features/catalog/queries"
import { formatNumber } from "@/lib/format"

const POPULAR_KEYWORDS = ["ReactJS", "Kế toán", "Marketing", "Thực tập", "Python", "Data Analyst"]

const fieldClass = "flex h-14 items-center gap-3 px-4 [&>svg]:size-[18px] [&>svg]:shrink-0 [&>svg]:text-muted-foreground"
const triggerClass = "h-full w-full border-0 bg-transparent px-0 text-[15px] shadow-none focus-visible:ring-0 dark:bg-transparent"

export function HeroSearch() {
  const navigate = useNavigate()
  const { data: categories = [] } = useCategories()
  const { data: cities = [] } = useCities()
  const { data: stats } = usePublicStats()
  const [keyword, setKeyword] = useState("")
  const [category, setCategory] = useState("all")
  const [city, setCity] = useState("all")

  const categoryOptions = [{ value: "all", label: "Tất cả ngành nghề" }, ...categories.map((c) => ({ value: String(c.id), label: c.name }))]
  const cityOptions = [{ value: "all", label: "Tất cả địa điểm" }, ...cities.map((c) => ({ value: String(c.id), label: c.name }))]

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const params = new URLSearchParams()
    if (keyword.trim()) params.set("q", keyword.trim())
    if (category !== "all") params.set("nganh", category)
    if (city !== "all") params.set("tinh", city)
    navigate(`/viec-lam?${params}`)
  }

  return (
    <section className="bg-hero bg-dots text-hero-foreground">
      <div className="mx-auto max-w-7xl px-4 py-20 text-center sm:px-6 lg:px-8 lg:py-28">
        <h1 className="mx-auto max-w-4xl text-[32px] font-bold leading-[1.15] sm:text-[46px]">Tìm việc đúng với năng lực của bạn</h1>
        <p className="mx-auto mt-5 max-w-2xl text-[17px] leading-relaxed opacity-90">
          Tải CV lên, hệ thống so khớp với {stats ? formatNumber(stats.open_jobs) : "các"} tin tuyển dụng đang mở và gợi ý 10 việc phù hợp
          nhất, kèm kỹ năng bạn còn thiếu.
        </p>
        <span aria-hidden="true" className="mx-auto mt-8 block h-1 w-20 rounded-full bg-brand" />

        <form
          onSubmit={handleSubmit}
          role="search"
          className="mx-auto mt-10 grid max-w-5xl overflow-hidden rounded-md bg-card text-left text-foreground shadow-xl md:grid-cols-[1.3fr_1fr_1fr_auto] md:divide-x"
        >
          <label className={fieldClass}>
            <Search aria-hidden="true" />
            <span className="sr-only">Từ khóa</span>
            <Input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Chức danh, kỹ năng hoặc công ty"
              className="h-full border-0 bg-transparent px-0 text-[15px] shadow-none focus-visible:ring-0 dark:bg-transparent"
            />
          </label>
          <div className={`${fieldClass} border-t md:border-t-0`}>
            <LayoutGrid aria-hidden="true" />
            <Select items={categoryOptions} value={category} onValueChange={(v) => setCategory(v ?? "all")}>
              <SelectTrigger className={triggerClass} aria-label="Ngành nghề">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categoryOptions.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className={`${fieldClass} border-t md:border-t-0`}>
            <MapPin aria-hidden="true" />
            <Select items={cityOptions} value={city} onValueChange={(v) => setCity(v ?? "all")}>
              <SelectTrigger className={triggerClass} aria-label="Địa điểm">
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
          </div>
          <div className="border-t p-2 md:border-t-0">
            <Button type="submit" className="h-full min-h-11 w-full px-7 font-bold uppercase">
              Tìm kiếm
            </Button>
          </div>
        </form>

        <p className="mx-auto mt-6 flex max-w-5xl flex-wrap items-center justify-center gap-2 text-sm">
          <span className="opacity-80">Tìm nhiều:</span>
          {POPULAR_KEYWORDS.map((word) => (
            <Link
              key={word}
              to={`/viec-lam?q=${encodeURIComponent(word)}`}
              className="rounded-full border border-hero-foreground/25 px-3 py-1 transition-colors hover:border-brand hover:text-brand"
            >
              {word}
            </Link>
          ))}
        </p>
      </div>
    </section>
  )
}
