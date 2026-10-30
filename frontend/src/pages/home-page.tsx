import { AudienceSplit } from "@/features/home/components/audience-split"
import { CategoriesSection } from "@/features/home/components/categories-section"
import { CvMatchPromo } from "@/features/home/components/cv-match-promo"
import { HeroSearch } from "@/features/home/components/hero-search"
import { LatestJobs } from "@/features/home/components/latest-jobs"
import { StatsStrip } from "@/features/home/components/stats-strip"

export function HomePage() {
  return (
    <main>
      <HeroSearch />
      <StatsStrip />
      <CvMatchPromo />
      <CategoriesSection />
      <AudienceSplit />
      <LatestJobs />
    </main>
  )
}
