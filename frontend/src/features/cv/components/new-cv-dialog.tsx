import { useState, type FormEvent } from "react"
import { useNavigate } from "react-router-dom"

import { FormError, FormField } from "@/components/common/form-field"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { useCreateCv } from "../queries"

export function NewCvDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const navigate = useNavigate()
  const createCv = useCreateCv()
  const [title, setTitle] = useState("")
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const clean = title.trim()
    if (clean.length < 2) {
      setError("Tên CV cần ít nhất 2 ký tự")
      return
    }
    setError(null)
    createCv.mutate(clean, {
      onSuccess: (cv) => navigate(`/cv/${cv.id}`),
      onError: (err) => setError(err.message),
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit} className="grid gap-5">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl font-bold">Tạo CV mới</DialogTitle>
            <DialogDescription>Đặt tên để phân biệt các CV, ví dụ theo vị trí bạn muốn ứng tuyển.</DialogDescription>
          </DialogHeader>
          <FormError message={error} />
          <FormField id="new-cv-title" label="Tên CV">
            <Input id="new-cv-title" className="h-11" maxLength={150} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ví dụ: CV Frontend Developer" />
          </FormField>
          <DialogFooter>
            <Button type="button" variant="outline" className="h-11" onClick={() => onOpenChange(false)}>
              Hủy
            </Button>
            <Button type="submit" disabled={createCv.isPending} className="h-11 px-5 font-bold uppercase">
              {createCv.isPending ? "Đang tạo…" : "Tạo và điền CV"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
