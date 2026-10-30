import type { ReactNode } from "react"

import { Label } from "@/components/ui/label"

export function FormField({ id, label, hint, children }: { id: string; label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id} className="font-semibold">
        {label}
      </Label>
      {children}
      {hint && <p className="text-[13px] text-muted-foreground">{hint}</p>}
    </div>
  )
}

export function FormError({ message }: { message: string | null }) {
  if (!message) return null
  return (
    <p role="alert" className="rounded-md border border-destructive/30 bg-destructive-soft px-3 py-2.5 text-sm text-destructive">
      {message}
    </p>
  )
}
