import { Badge } from "@/components/ui/badge"
import type { Match } from "@/types/api"
import { getMatchLevel } from "../match-level"
import { ScoreBreakdown } from "./score-breakdown"
import { SkillRequirements } from "./skill-requirements"

function SectionTitle({ children }: { children: string }) {
  return <h3 className="mb-3 text-[13px] font-semibold text-muted-foreground">{children}</h3>
}

/** Điểm tổng, cách tính và bảng kỹ năng: dùng chung cho trang Việc phù hợp và trang chi tiết việc làm */
export function MatchSummary({ match }: { match: Match }) {
  const level = getMatchLevel(match.score)
  return (
    <>
      <section className="p-5">
        <div className="flex items-center gap-3.5">
          <span className="font-heading text-[44px] font-bold leading-none text-brand tabular-nums">{Math.round(match.score)}</span>
          <span className="grid justify-items-start gap-1 text-[13px] text-muted-foreground">
            <Badge variant={level.variant}>{level.label}</Badge>
            Điểm phù hợp trên thang 100
          </span>
        </div>
      </section>
      <section className="border-t p-5">
        <SectionTitle>Cách tính điểm</SectionTitle>
        <ScoreBreakdown components={match.components} weights={match.weights} />
      </section>
      <section className="border-t p-5">
        <SectionTitle>Kỹ năng yêu cầu</SectionTitle>
        <SkillRequirements
          skills={match.skills}
          coverage={match.components.coverage}
          requiredMet={match.required_met}
          requiredTotal={match.required_total}
        />
      </section>
    </>
  )
}
