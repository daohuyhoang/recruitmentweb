import { ChevronLeft, ChevronRight } from "lucide-react"

import { Button } from "@/components/ui/button"

type PagerProps = { page: number; size: number; total: number; onChange: (page: number) => void }

function pageList(current: number, last: number): (number | "…")[] {
  const pages = new Set([1, last, current - 1, current, current + 1].filter((p) => p >= 1 && p <= last))
  const sorted = [...pages].sort((a, b) => a - b)
  const result: (number | "…")[] = []
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) result.push("…")
    result.push(p)
  })
  return result
}

export function Pager({ page, size, total, onChange }: PagerProps) {
  const last = Math.max(1, Math.ceil(total / size))
  if (last <= 1) return null
  return (
    <nav aria-label="Phân trang" className="flex flex-wrap items-center justify-center gap-1.5">
      <Button variant="outline" size="icon-lg" disabled={page <= 1} onClick={() => onChange(page - 1)} aria-label="Trang trước">
        <ChevronLeft />
      </Button>
      {pageList(page, last).map((p, i) =>
        p === "…" ? (
          <span key={`gap-${i}`} className="px-2 text-muted-foreground">
            …
          </span>
        ) : (
          <Button
            key={p}
            variant={p === page ? "default" : "outline"}
            size="icon-lg"
            onClick={() => onChange(p)}
            aria-current={p === page ? "page" : undefined}
            className="tabular-nums"
          >
            {p}
          </Button>
        ),
      )}
      <Button variant="outline" size="icon-lg" disabled={page >= last} onClick={() => onChange(page + 1)} aria-label="Trang sau">
        <ChevronRight />
      </Button>
    </nav>
  )
}
