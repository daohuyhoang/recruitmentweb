import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"

type ConfirmDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmLabel: string
  pending?: boolean
  onConfirm: () => void
}

/** Hỏi lại trước hành động khó hoàn tác, ví dụ xóa CV, rút hồ sơ */
export function ConfirmDialog({ open, onOpenChange, title, description, confirmLabel, pending, onConfirm }: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl font-bold">{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" className="h-11" onClick={() => onOpenChange(false)}>
            Giữ lại
          </Button>
          <Button type="button" variant="destructive" className="h-11 px-5 font-bold" disabled={pending} onClick={onConfirm}>
            {pending ? "Đang xử lý…" : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
