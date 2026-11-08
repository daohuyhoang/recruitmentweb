import type { ApplicationStatus, CvSectionState, EducationLevel, EmploymentType, Gender, IssueSeverity, WorkMode } from "@/types/api"

export const GENDER_LABELS: Record<Gender, string> = { male: "Nam", female: "Nữ", other: "Khác" }

export const ISSUE_SEVERITY: Record<IssueSeverity, { label: string; variant: "danger" | "warning" | "secondary" }> = {
  high: { label: "Cần sửa ngay", variant: "danger" },
  medium: { label: "Nên sửa", variant: "warning" },
  low: { label: "Có thể cải thiện", variant: "secondary" },
}

export const CV_SECTION_LABELS: Record<string, string> = {
  personal: "Thông tin cá nhân",
  objective: "Mục tiêu nghề nghiệp",
  experiences: "Kinh nghiệm làm việc",
  educations: "Học vấn",
  skills: "Kỹ năng",
  strengths: "Điểm mạnh",
}

export const CV_SECTION_STATE: Record<CvSectionState, { label: string; variant: "success" | "warning" | "danger" }> = {
  ok: { label: "Đạt", variant: "success" },
  warning: { label: "Cần xem lại", variant: "warning" },
  missing: { label: "Còn thiếu", variant: "danger" },
}

export const EMPLOYMENT_TYPE_LABELS: Record<EmploymentType, string> = {
  full_time: "Toàn thời gian",
  part_time: "Bán thời gian",
  internship: "Thực tập",
  contract: "Hợp đồng",
}

export const WORK_MODE_LABELS: Record<WorkMode, string> = {
  onsite: "Tại văn phòng",
  remote: "Từ xa",
  hybrid: "Linh hoạt",
}

export const EDUCATION_LABELS: Record<EducationLevel, string> = {
  none: "Không yêu cầu",
  high_school: "Trung học phổ thông",
  college: "Cao đẳng",
  university: "Đại học",
  master: "Thạc sĩ",
  doctor: "Tiến sĩ",
}

export const APPLICATION_STATUS: Record<
  ApplicationStatus,
  { label: string; variant: "secondary" | "info" | "warning" | "success" | "danger" }
> = {
  submitted: { label: "Đã nộp", variant: "secondary" },
  viewed: { label: "Đã xem", variant: "info" },
  interview: { label: "Phỏng vấn", variant: "warning" },
  accepted: { label: "Đạt", variant: "success" },
  rejected: { label: "Từ chối", variant: "danger" },
  withdrawn: { label: "Đã rút", variant: "secondary" },
}

export const CRITERIA_LABELS: Record<string, string> = {
  experience: "Kinh nghiệm",
  education: "Học vấn",
  location: "Địa điểm",
  salary: "Mức lương",
}
