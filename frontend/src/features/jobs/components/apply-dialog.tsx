import { useEffect, useState, type FormEvent } from "react"
import { toast } from "sonner"

import { FormError } from "@/components/common/form-field"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import { formatDate } from "@/lib/format"
import type { JobDetail } from "@/types/api"
import { useApply, useMyCvs } from "../queries"

type ApplyDialogProps = { job: JobDetail; open: boolean; onOpenChange: (open: boolean) => void }

export function ApplyDialog({ job, open, onOpenChange }: ApplyDialogProps) {
  const { data: cvs, isLoading } = useMyCvs(open)
  const apply = useApply(job.id)
  const [cvId, setCvId] = useState<string>("")
  const [coverLetter, setCoverLetter] = useState("")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (cvs && !cvId) setCvId(String((cvs.find((c) => c.is_default) ?? cvs[0])?.id ?? ""))
  }, [cvs, cvId])

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    if (!cvId) {
      setError("Chọn CV để ứng tuyển")
      return
    }
    apply.mutate(
      { cv_id: Number(cvId), cover_letter: coverLetter.trim() || undefined },
      {
        onSuccess: (result) => {
          onOpenChange(false)
          toast.success("Đã nộp hồ sơ", {
            description: `Điểm phù hợp của bạn với ${job.title}: ${Math.round(Number(result.match_score))}/100.`,
          })
        },
        onError: (err) => setError(err.message),
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit} className="grid gap-5">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl font-bold">Ứng tuyển {job.title}</DialogTitle>
            <DialogDescription>{job.company.name}</DialogDescription>
          </DialogHeader>

          <FormError message={error} />

          <fieldset className="grid gap-3">
            <legend className="mb-2 text-sm font-bold">Chọn CV</legend>
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Đang tải CV…</p>
            ) : !cvs?.length ? (
              <p className="text-sm text-muted-foreground">Bạn chưa có CV. Hãy tạo CV trước khi ứng tuyển.</p>
            ) : (
              <RadioGroup value={cvId} onValueChange={(v) => setCvId(String(v))} className="gap-2">
                {cvs.map((cv) => (
                  <Label
                    key={cv.id}
                    className="flex cursor-pointer items-center gap-3 rounded-md border p-3 font-normal has-data-checked:border-primary has-data-checked:bg-accent"
                  >
                    <RadioGroupItem value={String(cv.id)} />
                    <span className="flex-1">
                      <span className="block font-semibold">{cv.title}</span>
                      <span className="block text-[13px] text-muted-foreground">
                        {cv.skills.length} kỹ năng · sửa {formatDate(cv.updated_at)}
                      </span>
                    </span>
                    {cv.is_default && <Badge variant="info">CV chính</Badge>}
                  </Label>
                ))}
              </RadioGroup>
            )}
          </fieldset>

          <div className="grid gap-2">
            <Label htmlFor="cover-letter" className="font-bold">
              Thư giới thiệu <span className="font-normal text-muted-foreground">(không bắt buộc)</span>
            </Label>
            <Textarea
              id="cover-letter"
              rows={4}
              maxLength={3000}
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              placeholder="Vài câu về lý do bạn phù hợp với vị trí này"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" className="h-11" onClick={() => onOpenChange(false)}>
              Hủy
            </Button>
            <Button type="submit" disabled={apply.isPending || !cvs?.length} className="h-11 px-5 font-bold uppercase">
              {apply.isPending ? "Đang nộp…" : "Nộp hồ sơ"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
