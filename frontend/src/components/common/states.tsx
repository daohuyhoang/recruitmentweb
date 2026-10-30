import type { ReactNode } from "react"

import { Card } from "@/components/ui/card"

export function EmptyState({ title, description, action }: { title: string; description?: ReactNode; action?: ReactNode }) {
  return (
    <Card className="items-center gap-0 px-6 py-14 text-center">
      <p className="font-heading text-lg font-bold">{title}</p>
      {description && <p className="mt-2 max-w-md text-muted-foreground">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </Card>
  )
}

export function ErrorState({ error }: { error: unknown }) {
  const message = error instanceof Error ? error.message : "Đã có lỗi xảy ra"
  return <EmptyState title="Không tải được dữ liệu" description={message} />
}
