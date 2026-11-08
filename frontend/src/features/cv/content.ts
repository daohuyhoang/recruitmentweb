import type { CvCertificate, CvContent, CvEducation, CvExperience, CvProject } from "@/types/api"

export const emptyExperience = (): CvExperience => ({ company: "", position: "", start: null, end: null, description: "" })
export const emptyEducation = (): CvEducation => ({ school: "", major: "", degree: "", start: null, end: null, gpa: null })
export const emptyProject = (): CvProject => ({ name: "", role: "", start: null, end: null, description: "", link: null })
export const emptyCertificate = (): CvCertificate => ({ name: "", issuer: "", year: null })

export const emptyContent = (): CvContent => ({
  personal: { full_name: "", email: "", phone: "", address: "", headline: "" },
  objective: "",
  experiences: [],
  educations: [],
  projects: [],
  certificates: [],
  skills: [],
  strengths: "",
})

const hasValue = (item: object) => Object.values(item).some((v) => v !== null && v !== "")

/** Bỏ các dòng người dùng bấm thêm nhưng chưa điền, để chúng không bị tính là mục thiếu nội dung khi đánh giá */
export function cleanContent(content: CvContent): CvContent {
  return {
    ...content,
    experiences: content.experiences.filter(hasValue),
    educations: content.educations.filter(hasValue),
    projects: content.projects.filter(hasValue),
    certificates: content.certificates.filter(hasValue),
    skills: content.skills.map((s) => s.trim()).filter(Boolean),
  }
}

/** Tìm ô nhập theo đường dẫn lỗi của backend (ví dụ experiences.0.description), cuộn tới và đặt con trỏ vào đó */
export function focusCvField(field: string | null, section: string) {
  const byId = (name: string) => document.getElementById(`cv-${name.replaceAll(".", "-")}`)
  const target = (field && byId(field)) || byId(section)
  if (!target) return
  target.scrollIntoView({ block: "center" })
  const input = target.matches("input, textarea") ? target : target.querySelector<HTMLElement>("input, textarea")
  input?.focus({ preventScroll: true })
}
