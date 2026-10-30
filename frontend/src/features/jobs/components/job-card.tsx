import { BriefcaseBusiness, MapPin, Wallet } from "lucide-react"
import { Link } from "react-router-dom"

import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { daysUntil, formatDate, formatSalary, timeAgo } from "@/lib/format"
import { EMPLOYMENT_TYPE_LABELS } from "@/lib/labels"
import { cn } from "@/lib/utils"
import type { JobSummary } from "@/types/api"

export function JobCard({ job }: { job: JobSummary }) {
  const daysLeft = daysUntil(job.deadline)
  return (
    <Card className="group relative gap-0 p-6 transition-shadow hover:shadow-md">
      <h3 className="text-lg font-bold leading-snug">
        <Link to={`/viec-lam/${job.id}`} className="after:absolute after:inset-0 group-hover:text-primary">
          {job.title}
        </Link>
      </h3>
      <p className="mt-1 text-sm text-muted-foreground">{job.company.name}</p>
      <p className="mt-1 text-[13px] text-muted-foreground">{job.category.name}</p>

      <ul className="mt-4 grid gap-1.5 text-sm [&_li]:flex [&_li]:items-center [&_li]:gap-2 [&_svg]:size-4 [&_svg]:text-primary">
        <li>
          <MapPin aria-hidden="true" />
          {job.city.name}
        </li>
        <li>
          <BriefcaseBusiness aria-hidden="true" />
          {EMPLOYMENT_TYPE_LABELS[job.employment_type]}
        </li>
        <li className="font-semibold tabular-nums">
          <Wallet aria-hidden="true" />
          {formatSalary(job.salary_min, job.salary_max)}
        </li>
      </ul>

      <div className="mt-4 flex flex-1 flex-wrap content-start gap-1.5">
        {job.skills
          .filter((s) => s.required)
          .slice(0, 4)
          .map((s) => (
            <Badge key={s.skill_id} variant="outline" className="h-6 rounded-sm bg-muted px-2 text-[13px] font-normal">
              {s.name}
            </Badge>
          ))}
      </div>

      <div className="mt-5 flex items-center justify-between border-t pt-4 text-[13px] text-muted-foreground">
        <span className={cn(daysLeft <= 7 && "font-medium text-warning")}>
          {daysLeft <= 7 ? (
            `Còn ${daysLeft} ngày`
          ) : (
            <>
              Hạn nộp <span className="font-semibold text-foreground tabular-nums">{formatDate(job.deadline)}</span>
            </>
          )}
        </span>
        <span>{timeAgo(job.published_at)}</span>
      </div>
    </Card>
  )
}
