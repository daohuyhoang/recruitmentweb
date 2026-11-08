import { ClipboardCheck, PencilLine } from "lucide-react"
import { useMemo, useState } from "react"

import { FormError, FormField } from "@/components/common/form-field"
import { SelectField } from "@/components/common/select-field"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { useJob } from "@/features/jobs/queries"
import { useTopMatches } from "@/features/matching/queries"
import { formatDateTime } from "@/lib/format"
import { CV_SECTION_LABELS, CV_SECTION_STATE, ISSUE_SEVERITY } from "@/lib/labels"
import type { CvEvaluation, IssueSeverity } from "@/types/api"
import { focusCvField } from "../content"
import { useEvaluateCv } from "../queries"

const GENERAL = "general"
const SEVERITY_ORDER: IssueSeverity[] = ["high", "medium", "low"]

function scoreLevel(score: number) {
  if (score >= 80) return { label: "CV tốt", variant: "success" as const }
  if (score >= 65) return { label: "Khá", variant: "info" as const }
  if (score >= 50) return { label: "Cần cải thiện", variant: "warning" as const }
  return { label: "Cần sửa nhiều", variant: "danger" as const }
}

function EvaluationResult({ result }: { result: CvEvaluation }) {
  const level = scoreLevel(result.overall_score)
  const issues = [...result.issues].sort((a, b) => SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity))

  return (
    <>
      <section className="border-t p-5">
        <div className="flex items-center gap-3.5">
          <span className="font-heading text-[44px] font-bold leading-none text-brand tabular-nums">{result.overall_score}</span>
          <span className="grid justify-items-start gap-1 text-[13px] text-muted-foreground">
            <Badge variant={level.variant}>{level.label}</Badge>
            Điểm CV trên thang 100
          </span>
        </div>
        <Progress value={result.overall_score} className="mt-4" aria-label="Điểm CV" />
        <p className="mt-3 text-[13px] text-muted-foreground">
          {result.job_title ? `Đánh giá theo vị trí ${result.job_title}` : "Đánh giá chung"} · {formatDateTime(result.created_at)}
        </p>
      </section>

      <section className="border-t p-5">
        <h3 className="mb-3 text-[13px] font-semibold text-muted-foreground">Các phần trong CV</h3>
        <ul className="grid gap-2 text-sm">
          {Object.entries(result.sections).map(([section, state]) => (
            <li key={section} className="flex items-center justify-between gap-3">
              {CV_SECTION_LABELS[section] ?? section}
              <Badge variant={CV_SECTION_STATE[state].variant}>{CV_SECTION_STATE[state].label}</Badge>
            </li>
          ))}
        </ul>
      </section>

      <section className="border-t p-5">
        <h3 className="mb-3 text-[13px] font-semibold text-muted-foreground">Gợi ý sửa ({issues.length})</h3>
        {issues.length === 0 ? (
          <p className="text-sm text-muted-foreground">Không phát hiện vấn đề nào. CV đã đủ các phần và nội dung cụ thể.</p>
        ) : (
          <ul className="grid gap-4">
            {issues.map((issue, index) => (
              <li key={`${issue.code}-${index}`} className="grid justify-items-start gap-1.5 border-t pt-4 first:border-t-0 first:pt-0">
                <Badge variant={ISSUE_SEVERITY[issue.severity].variant}>{ISSUE_SEVERITY[issue.severity].label}</Badge>
                <p className="text-sm font-semibold leading-snug">{issue.message}</p>
                <p className="text-sm leading-relaxed text-muted-foreground">{issue.suggestion}</p>
                <Button type="button" variant="link" className="h-auto p-0" onClick={() => focusCvField(issue.field, issue.section)}>
                  <PencilLine data-icon="inline-start" />
                  Sửa mục này
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  )
}

type EvaluationPanelProps = {
  cvId: number
  initialJobId?: number
  /** Đánh giá chạy trên bản đã lưu, nên phải lưu form trước. Trả về false nếu chưa lưu được. */
  onBeforeEvaluate: () => Promise<boolean>
}

/** Chức năng 3: chấm CV theo quy tắc và gợi ý sửa, có thể theo một việc cụ thể */
export function EvaluationPanel({ cvId, initialJobId, onBeforeEvaluate }: EvaluationPanelProps) {
  const [jobValue, setJobValue] = useState(initialJobId ? String(initialJobId) : GENERAL)
  const [result, setResult] = useState<CvEvaluation | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [running, setRunning] = useState(false)
  const evaluate = useEvaluateCv(cvId)
  const { data: matches } = useTopMatches({ cv_id: cvId })
  // Việc mở từ đường dẫn có thể không nằm trong Top 10 nên phải lấy tên riêng
  const { data: linkedJob } = useJob(initialJobId ?? Number.NaN)

  const options = useMemo(() => {
    const items = [{ value: GENERAL, label: "Đánh giá chung, chưa theo việc nào" }]
    if (linkedJob) items.push({ value: String(linkedJob.id), label: linkedJob.title })
    for (const match of matches?.items ?? []) {
      if (match.job.id !== linkedJob?.id) items.push({ value: String(match.job.id), label: match.job.title })
    }
    return items
  }, [matches, linkedJob])

  async function handleEvaluate() {
    setError(null)
    setRunning(true)
    try {
      if (await onBeforeEvaluate()) {
        setResult(await evaluate.mutateAsync(jobValue === GENERAL ? undefined : Number(jobValue)))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không đánh giá được CV")
    } finally {
      setRunning(false)
    }
  }

  return (
    <Card className="gap-0 py-0">
      <section className="grid gap-4 p-5">
        <div className="flex items-center gap-2">
          <ClipboardCheck className="size-5 text-primary" aria-hidden="true" />
          <h2 className="font-heading text-lg font-bold">Đánh giá CV</h2>
        </div>
        <FormField id="evaluate-job" label="Đánh giá theo việc" hint="Danh sách gồm các việc phù hợp nhất với CV này.">
          <SelectField id="evaluate-job" value={jobValue} onChange={setJobValue} options={options} />
        </FormField>
        <FormError message={error} />
        <Button type="button" onClick={handleEvaluate} disabled={running} className="h-11 font-bold uppercase">
          {running ? "Đang đánh giá…" : "Lưu và đánh giá CV"}
        </Button>
      </section>
      {result && <EvaluationResult result={result} />}
    </Card>
  )
}
