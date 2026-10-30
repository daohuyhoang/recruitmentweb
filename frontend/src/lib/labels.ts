import type { ApplicationStatus, EducationLevel, EmploymentType, WorkMode } from "@/types/api"

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
