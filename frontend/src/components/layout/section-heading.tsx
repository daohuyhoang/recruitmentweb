import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

type SectionHeadingProps = {
  eyebrow?: string
  title: string
  description?: ReactNode
  align?: "left" | "center"
  className?: string
}

export function SectionHeading({ eyebrow, title, description, align = "left", className }: SectionHeadingProps) {
  const centered = align === "center"
  return (
    <div className={cn(centered && "mx-auto max-w-3xl text-center", className)}>
      {eyebrow && <p className="mb-3 text-sm font-bold tracking-wide text-primary uppercase">{eyebrow}</p>}
      <h2 className="text-[28px] font-bold leading-tight sm:text-[36px]">{title}</h2>
      {description && <p className="mt-4 leading-relaxed text-muted-foreground">{description}</p>}
      {centered && <span aria-hidden="true" className="mx-auto mt-6 block h-1 w-20 rounded-full bg-brand" />}
    </div>
  )
}
