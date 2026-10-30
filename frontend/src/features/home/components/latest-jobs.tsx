import { ArrowRight } from "lucide-react"
import { SectionHeading } from "@/components/layout/section-heading"
import { Skeleton } from "@/components/ui/skeleton"
import { JobCard } from "@/features/jobs/components/job-card"
import { useJobs } from "@/features/jobs/queries"
import { ButtonLink } from "@/components/common/button-link"

export function LatestJobs() {
  const { data, isLoading } = useJobs({ size: 6, sort: "newest" })
  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <SectionHeading title="Việc làm mới nhất" description="Tin vừa được duyệt, còn hạn nộp hồ sơ." className="max-w-2xl" />
        <ButtonLink
          variant="outline"
          to="/viec-lam"
          className="h-12 border-primary px-6 font-bold text-primary uppercase hover:bg-primary hover:text-primary-foreground"
        >
          Xem tất cả việc làm
          <ArrowRight data-icon="inline-end" />
        </ButtonLink>
      </div>
      <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {isLoading && Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-72 rounded-lg" />)}
        {data?.items.map((job) => (
          <JobCard key={job.id} job={job} />
        ))}
      </div>
    </section>
  )
}
