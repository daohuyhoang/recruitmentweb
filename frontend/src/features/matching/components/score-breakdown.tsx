import { Progress } from "@/components/ui/progress"
import { formatNumber } from "@/lib/format"
import type { MatchComponents } from "@/types/api"
import { toPercent } from "../match-level"

const ROWS: { key: keyof MatchComponents; label: string; short: string; method: string }[] = [
  { key: "coverage", label: "Kỹ năng khớp", short: "Kỹ năng", method: "Coverage" },
  { key: "tfidf", label: "Từ khóa", short: "Từ khóa", method: "TF-IDF" },
  { key: "semantic", label: "Ngữ nghĩa", short: "Ngữ nghĩa", method: "Sentence-BERT" },
  { key: "criteria", label: "Tiêu chí khác", short: "Tiêu chí", method: "kinh nghiệm, học vấn, địa điểm" },
]

type ScoreBreakdownProps = { components: MatchComponents; weights: Record<keyof MatchComponents, number> }

export function ScoreBreakdown({ components, weights }: ScoreBreakdownProps) {
  const formula = ROWS.map((r) => `${formatNumber(weights[r.key])} × ${r.short}`).join(" + ")
  return (
    <div className="grid gap-3.5">
      <dl className="grid gap-3.5">
        {ROWS.map((row) => {
          const value = components[row.key]
          return (
            <div key={row.key} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1.5">
              <dt className="text-sm">
                {row.label}
                <span className="ml-1.5 text-xs text-muted-foreground">
                  {row.method} · {toPercent(weights[row.key])}%
                </span>
              </dt>
              <dd className="text-sm font-semibold tabular-nums">{value === null ? "Chưa có" : `${toPercent(value)}%`}</dd>
              <Progress value={value === null ? 0 : toPercent(value)} aria-label={row.label} className="col-span-2" />
            </div>
          )
        })}
      </dl>
      <p className="text-xs text-muted-foreground">
        Điểm = {formula}
        {components.semantic === null && ". Chưa có điểm ngữ nghĩa nên trọng số được chia lại cho 3 thành phần còn lại."}
      </p>
    </div>
  )
}
