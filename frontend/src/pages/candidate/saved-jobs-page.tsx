import { BookmarkX } from "lucide-react"
import { toast } from "sonner"

import { ButtonLink } from "@/components/common/button-link"
import { EmptyState, ErrorState } from "@/components/common/states"
import { PageBanner } from "@/components/layout/page-banner"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useSavedJobs } from "@/features/applications/queries"
import { JobCard } from "@/features/jobs/components/job-card"
import { useToggleSaveJob } from "@/features/jobs/queries"
import type { JobSummary } from "@/types/api"

function SavedJob({ job }: { job: JobSummary }) {
  const toggle = useToggleSaveJob(job.id)
  return (
    <div className="grid grid-rows-[1fr_auto] gap-2">
      <JobCard job={job} />
      <Button
        type="button"
        variant="outline"
        className="h-10"
        disabled={toggle.isPending}
        onClick={() =>
          toggle.mutate(true, {
            onSuccess: () => toast.success("Đã bỏ lưu việc"),
            onError: (err) => toast.error(err.message),
          })
        }
      >
        <BookmarkX data-icon="inline-start" />
        Bỏ lưu việc này
      </Button>
    </div>
  )
}

export function SavedJobsPage() {
  const { data: jobs, error, isLoading } = useSavedJobs()

  return (
    <main>
      <PageBanner
        title="Việc đã lưu"
        breadcrumb={[{ to: "/", label: "Trang chủ" }, { label: "Việc đã lưu" }]}
        description="Các tin bạn đã đánh dấu để xem lại và ứng tuyển sau."
      />
      <div className="mx-auto max-w-7xl px-4 pt-8 pb-16 sm:px-6 lg:px-8">
        {error ? (
          <ErrorState error={error} />
        ) : isLoading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }, (_, i) => (
              <Skeleton key={i} className="h-72 rounded-lg" />
            ))}
          </div>
        ) : !jobs?.length ? (
          <EmptyState
            title="Bạn chưa lưu việc nào"
            description="Mở một tin tuyển dụng và bấm Lưu việc, tin đó sẽ hiện ở đây."
            action={
              <ButtonLink to="/viec-lam" className="h-11 px-5 font-bold uppercase">
                Tìm việc làm
              </ButtonLink>
            }
          />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {jobs.map((job) => (
              <SavedJob key={job.id} job={job} />
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
