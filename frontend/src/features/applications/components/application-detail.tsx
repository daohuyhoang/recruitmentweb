import { ArrowRight, CalendarClock } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

import { ButtonLink } from "@/components/common/button-link"
import { ConfirmDialog } from "@/components/common/confirm-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { getMatchLevel } from "@/features/matching/match-level"
import { formatDateTime } from "@/lib/format"
import { APPLICATION_STATUS } from "@/lib/labels"
import { cn } from "@/lib/utils"
import type { CandidateApplication } from "@/types/api"
import { useWithdrawApplication } from "../queries"

const WITHDRAWABLE = ["submitted", "viewed", "interview"]

export function ApplicationDetail({ application }: { application: CandidateApplication }) {
  const [confirmOpen, setConfirmOpen] = useState(false)
  const withdraw = useWithdrawApplication()
  const status = APPLICATION_STATUS[application.status]
  const score = application.match_score === null ? null : Math.round(Number(application.match_score))
  const history = [...application.history].sort((a, b) => b.created_at.localeCompare(a.created_at))

  function handleWithdraw() {
    withdraw.mutate(application.id, {
      onSuccess: () => {
        setConfirmOpen(false)
        toast.success("Đã rút hồ sơ")
      },
      onError: (err) => {
        setConfirmOpen(false)
        toast.error(err.message)
      },
    })
  }

  return (
    <Card className="gap-0 py-0">
      <section className="border-b p-5">
        <h2 className="text-lg font-bold leading-snug">{application.job.title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {application.job.company.name} · {application.job.city.name}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Badge variant={status.variant}>{status.label}</Badge>
          {score !== null && <Badge variant={getMatchLevel(score).variant}>{score} điểm phù hợp lúc nộp</Badge>}
        </div>
      </section>

      {application.status === "interview" && application.interview_at && (
        <section className="flex items-center gap-2.5 border-b bg-warning-soft p-5 text-sm font-semibold text-warning">
          <CalendarClock className="size-5 shrink-0" aria-hidden="true" />
          Lịch phỏng vấn: <span className="tabular-nums">{formatDateTime(application.interview_at)}</span>
        </section>
      )}

      <section className="p-5">
        <h3 className="mb-3 text-[13px] font-semibold text-muted-foreground">Tiến trình hồ sơ</h3>
        <ol className="grid gap-4">
          {history.map((step, index) => (
            <li key={`${step.to_status}-${step.created_at}`} className="flex gap-3">
              <span aria-hidden="true" className={cn("mt-1.5 size-2.5 shrink-0 rounded-full", index === 0 ? "bg-brand" : "bg-border")} />
              <div>
                <p className={cn("text-sm", index === 0 && "font-semibold")}>{APPLICATION_STATUS[step.to_status].label}</p>
                <p className="text-[13px] text-muted-foreground tabular-nums">{formatDateTime(step.created_at)}</p>
                {step.note && <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{step.note}</p>}
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="border-t p-5 text-sm">
        <h3 className="mb-2 text-[13px] font-semibold text-muted-foreground">CV đã nộp</h3>
        <p className="font-semibold">{application.cv.title}</p>
        {application.cover_letter && (
          <>
            <h3 className="mt-4 mb-2 text-[13px] font-semibold text-muted-foreground">Thư giới thiệu</h3>
            <p className="leading-relaxed whitespace-pre-line">{application.cover_letter}</p>
          </>
        )}
      </section>

      <section className="grid gap-2 border-t p-5">
        <ButtonLink size="lg" className="h-11 w-full font-bold uppercase" to={`/viec-lam/${application.job.id}`}>
          Xem tin tuyển dụng
          <ArrowRight data-icon="inline-end" />
        </ButtonLink>
        {WITHDRAWABLE.includes(application.status) && (
          <Button type="button" variant="destructive" className="h-11 font-bold" onClick={() => setConfirmOpen(true)}>
            Rút hồ sơ này
          </Button>
        )}
      </section>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Rút hồ sơ ứng tuyển?"
        description={`Nhà tuyển dụng ${application.job.company.name} sẽ được thông báo, và bạn không thể nộp lại cho tin này.`}
        confirmLabel="Rút hồ sơ"
        pending={withdraw.isPending}
        onConfirm={handleWithdraw}
      />
    </Card>
  )
}
