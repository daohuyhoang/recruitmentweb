import { ArrowRight } from "lucide-react"
import { ButtonLink } from "@/components/common/button-link"
import { Card } from "@/components/ui/card"
import type { Match } from "@/types/api"
import { MatchSummary } from "./match-summary"

export function MatchDetail({ match }: { match: Match }) {
  return (
    <Card className="gap-0 py-0">
      <section className="border-b p-5">
        <h2 className="text-lg font-bold leading-snug">{match.job.title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {match.job.company.name} · {match.job.city.name}
        </p>
      </section>
      <MatchSummary match={match} />
      <section className="border-t p-5">
        <ButtonLink size="lg" className="h-11 w-full font-bold uppercase" to={`/viec-lam/${match.job.id}`}>
          Xem chi tiết và ứng tuyển
          <ArrowRight data-icon="inline-end" />
        </ButtonLink>
      </section>
    </Card>
  )
}
