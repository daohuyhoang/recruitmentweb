// Kiểu dữ liệu khớp với backend/app/schemas.py. Số thập phân (Decimal) được trả về dạng chuỗi.

export type Decimal = string

export type Role = "candidate" | "employer" | "admin"
export type UserStatus = "active" | "pending" | "locked"
export type EmploymentType = "full_time" | "part_time" | "internship" | "contract"
export type WorkMode = "onsite" | "remote" | "hybrid"
export type EducationLevel = "none" | "high_school" | "college" | "university" | "master" | "doctor"
export type JobStatus = "draft" | "pending" | "approved" | "rejected" | "closed"
export type ApplicationStatus = "submitted" | "viewed" | "interview" | "accepted" | "rejected" | "withdrawn"

export type Page<T> = { items: T[]; total: number; page: number; size: number }
export type Message = { message: string }

export type City = { id: number; name: string; slug: string }

export type Category = {
  id: number
  parent_id: number | null
  name: string
  slug: string
  description: string | null
  icon: string | null
  open_jobs: number
  children: Category[]
}

export type CompanyBrief = { id: number; name: string; slug: string; logo_url: string | null; is_verified: boolean }

export type User = {
  id: number
  email: string
  full_name: string
  phone: string | null
  avatar_url: string | null
  role: Role
  status: UserStatus
  created_at: string
  company: CompanyBrief | null
}

export type TokenOut = { access_token: string; token_type: string; user: User }

export type JobSkill = { skill_id: number; name: string; required: boolean }

export type JobSummary = {
  id: number
  slug: string
  title: string
  company: CompanyBrief
  category: { id: number; name: string; parent_id: number | null }
  city: City
  employment_type: EmploymentType
  work_mode: WorkMode
  salary_min: Decimal | null
  salary_max: Decimal | null
  experience_min_years: Decimal
  experience_max_years: Decimal | null
  deadline: string
  published_at: string | null
  status: JobStatus
  skills: JobSkill[]
}

export type JobDetail = JobSummary & {
  description: string
  requirements: string
  benefits: string | null
  address: string | null
  education_level: EducationLevel
  vacancies: number
  view_count: number
  rejection_reason: string | null
  created_at: string
  application_count: number | null
  is_saved: boolean | null
  application_id: number | null
}

export type CvSkill = { skill_id: number; name: string; source: "parsed" | "manual" }

export type Cv = {
  id: number
  title: string
  source: "upload" | "builder"
  file_name: string | null
  file_size: number | null
  template: string
  parse_status: "pending" | "done" | "failed"
  parse_error: string | null
  is_default: boolean
  created_at: string
  updated_at: string
  skills: CvSkill[]
}

export type CvPersonal = { full_name: string; email: string; phone: string; address: string; headline: string }
export type CvExperience = { company: string; position: string; start: string | null; end: string | null; description: string }
export type CvEducation = { school: string; major: string; degree: string; start: string | null; end: string | null; gpa: string | null }
export type CvProject = { name: string; role: string; start: string | null; end: string | null; description: string; link: string | null }
export type CvCertificate = { name: string; issuer: string; year: number | null }

export type CvContent = {
  personal: CvPersonal
  objective: string
  experiences: CvExperience[]
  educations: CvEducation[]
  projects: CvProject[]
  certificates: CvCertificate[]
  skills: string[]
  strengths: string
}

export type CvDetail = Cv & { content: CvContent | null }

export type IssueSeverity = "high" | "medium" | "low"
export type CvIssue = { code: string; section: string; severity: IssueSeverity; message: string; suggestion: string; field: string | null }
export type CvSectionState = "ok" | "warning" | "missing"

export type CvEvaluation = {
  id: number
  cv_id: number
  job_id: number | null
  job_title: string | null
  overall_score: number
  issues: CvIssue[]
  sections: Record<string, CvSectionState>
  created_at: string
}

export type SkillOption = { id: number; name: string }

export type Gender = "male" | "female" | "other"

export type Profile = {
  user_id: number
  headline: string | null
  date_of_birth: string | null
  gender: Gender | null
  address: string | null
  city_id: number | null
  desired_category_id: number | null
  desired_salary_min: Decimal | null
  desired_salary_max: Decimal | null
  years_of_experience: Decimal | null
  education_level: EducationLevel | null
  summary: string | null
  is_searchable: boolean
}

export type ProfileInput = Omit<Profile, "user_id">

export type MatchComponents = { coverage: number; tfidf: number; semantic: number | null; criteria: number }
export type MatchSkill = { skill_id: number; name: string; required: boolean; matched: boolean }

export type Match = {
  job: JobSummary
  score: number
  components: MatchComponents
  weights: Record<keyof MatchComponents, number>
  criteria_detail: Record<string, number>
  skills: MatchSkill[]
  required_met: number
  required_total: number
}

export type TopMatches = { cv: Cv; items: Match[]; semantic_available: boolean; segmenter: string }

export type CountItem = { label: string; value: number }

export type CandidateApplication = {
  id: number
  job: JobSummary
  cv: { id: number; title: string; source: string; file_name: string | null }
  status: ApplicationStatus
  match_score: Decimal | null
  cover_letter: string | null
  interview_at: string | null
  applied_at: string
  updated_at: string
  history: { from_status: ApplicationStatus | null; to_status: ApplicationStatus; note: string | null; created_at: string }[]
}
