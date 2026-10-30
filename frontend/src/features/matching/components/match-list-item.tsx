import { BriefcaseBusiness, CalendarClock, MapPin, Wallet } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { daysUntil, formatDate, formatExperience, formatSalary } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { Match } from "@/types/api"
import { getMatchLevel } from "../match-level"

type MatchListItemProps = {
  match: Match
  rank: number
  selected: boolean
  onSelect: () => void
}

export function MatchListItem({ match, rank, selected, onSelect }: MatchListItemProps) {
  const { job } = match
  const level = getMatchLevel(match.score)
  const daysLeft = daysUntil(job.deadline)
  const score = Math.round(match.score)

  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      className={cn(
        "relative grid w-full grid-cols-[2rem_minmax(0,1fr)] items-center gap-x-4 gap-y-3 px-4 py-4 text-left outline-none transition-colors hover:bg-muted/70 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset sm:grid-cols-[2rem_minmax(0,1fr)_8.5rem] sm:pr-5",
        selected && "bg-accent hover:bg-accent before:absolute before:inset-y-0 before:left-0 before:w-[3px] before:bg-primary",
      )}
    >
      <span className="text-center text-sm font-semibold tabular-nums text-muted-foreground">{String(rank).padStart(2, "0")}</span>

      <span className="grid min-w-0 gap-0.5">
        <span className="text-[15px] font-semibold leading-snug">{job.title}</span>
        <span className="text-sm text-muted-foreground">{job.company.name}</span>
        <span className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-muted-foreground [&>span]:inline-flex [&>span]:items-center [&>span]:gap-1.5 [&_svg]:size-3.5">
          <span>
            <MapPin aria-hidden="true" />
            {job.city.name}
          </span>
          <span className="tabular-nums">
            <Wallet aria-hidden="true" />
            {formatSalary(job.salary_min, job.salary_max)}
          </span>
          <span>
            <BriefcaseBusiness aria-hidden="true" />
            {formatExperience(job.experience_min_years, job.experience_max_years)}
          </span>
          <span className={cn(daysLeft <= 7 && "font-medium text-warning")}>
            <CalendarClock aria-hidden="true" />
            {daysLeft <= 7 ? `Còn ${daysLeft} ngày` : `Hạn ${formatDate(job.deadline)}`}
          </span>
        </span>
      </span>

      <span className="col-start-2 flex items-center gap-3 sm:col-start-3 sm:grid sm:justify-items-end sm:gap-1.5">
        <span className="flex items-baseline gap-1">
          <span className="text-2xl font-bold leading-none tabular-nums">{score}</span>
          <span className="text-xs text-muted-foreground">/100</span>
        </span>
        <Progress value={score} aria-label="Điểm phù hợp" className="w-20 sm:w-full" />
        <Badge variant={level.variant}>{level.label}</Badge>
      </span>
    </button>
  )
}
