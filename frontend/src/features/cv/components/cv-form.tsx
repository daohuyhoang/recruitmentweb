import { Plus, Trash2 } from "lucide-react"
import type { ReactNode } from "react"

import { FormField } from "@/components/common/form-field"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import type { CvContent, CvPersonal } from "@/types/api"
import { emptyCertificate, emptyEducation, emptyExperience, emptyProject } from "../content"
import { SkillsInput } from "./skills-input"

type ListKey = "experiences" | "educations" | "projects" | "certificates"

function Section({ id, title, hint, children, action }: { id: string; title: string; hint?: string; children: ReactNode; action?: ReactNode }) {
  return (
    <Card id={id} className="scroll-mt-24 gap-4 p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold">{title}</h2>
          {hint && <p className="mt-1 text-[13px] text-muted-foreground">{hint}</p>}
        </div>
        {action}
      </div>
      {children}
    </Card>
  )
}

function AddButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <Button type="button" variant="outline" className="h-9 px-3" onClick={onClick}>
      <Plus data-icon="inline-start" />
      {label}
    </Button>
  )
}

function ItemBox({ id, label, onRemove, children }: { id: string; label: string; onRemove: () => void; children: ReactNode }) {
  return (
    <div id={id} className="grid gap-4 rounded-md border p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold">{label}</p>
        <Button type="button" variant="ghost" size="icon-sm" aria-label={`Xóa ${label}`} onClick={onRemove}>
          <Trash2 />
        </Button>
      </div>
      {children}
    </div>
  )
}

function PeriodFields({
  idPrefix,
  start,
  end,
  onChange,
}: {
  idPrefix: string
  start: string | null
  end: string | null
  onChange: (patch: { start?: string | null; end?: string | null }) => void
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <FormField id={`${idPrefix}-start`} label="Từ tháng">
        <Input id={`${idPrefix}-start`} type="month" className="h-11" value={start ?? ""} onChange={(e) => onChange({ start: e.target.value || null })} />
      </FormField>
      <FormField id={`${idPrefix}-end`} label="Đến tháng" hint="Để trống nếu vẫn đang tiếp tục.">
        <Input id={`${idPrefix}-end`} type="month" className="h-11" value={end ?? ""} onChange={(e) => onChange({ end: e.target.value || null })} />
      </FormField>
    </div>
  )
}

const PERSONAL_FIELDS: { key: keyof CvPersonal; label: string; type?: string; placeholder?: string }[] = [
  { key: "full_name", label: "Họ và tên" },
  { key: "headline", label: "Chức danh", placeholder: "Ví dụ: Frontend Developer" },
  { key: "email", label: "Email", type: "email" },
  { key: "phone", label: "Số điện thoại", type: "tel" },
]

export function CvForm({ value, onChange }: { value: CvContent; onChange: (next: CvContent) => void }) {
  const setPersonal = (patch: Partial<CvPersonal>) => onChange({ ...value, personal: { ...value.personal, ...patch } })

  function patchItem<K extends ListKey>(key: K, index: number, patch: Partial<CvContent[K][number]>) {
    onChange({ ...value, [key]: value[key].map((item, i) => (i === index ? { ...item, ...patch } : item)) })
  }
  const addItem = <K extends ListKey>(key: K, item: CvContent[K][number]) => onChange({ ...value, [key]: [...value[key], item] })
  const removeItem = (key: ListKey, index: number) => onChange({ ...value, [key]: value[key].filter((_, i) => i !== index) })

  return (
    <>
      <Section id="cv-personal" title="Thông tin cá nhân">
        <div className="grid gap-4 sm:grid-cols-2">
          {PERSONAL_FIELDS.map((field) => (
            <FormField key={field.key} id={`cv-personal-${field.key}`} label={field.label}>
              <Input
                id={`cv-personal-${field.key}`}
                type={field.type ?? "text"}
                className="h-11"
                placeholder={field.placeholder}
                value={value.personal[field.key]}
                onChange={(e) => setPersonal({ [field.key]: e.target.value })}
              />
            </FormField>
          ))}
        </div>
        <FormField id="cv-personal-address" label="Địa chỉ">
          <Input id="cv-personal-address" className="h-11" value={value.personal.address} onChange={(e) => setPersonal({ address: e.target.value })} />
        </FormField>
      </Section>

      <Section id="cv-objective-section" title="Mục tiêu nghề nghiệp" hint="2–3 câu: vị trí muốn ứng tuyển, thế mạnh chính, mục tiêu trong 1–2 năm tới.">
        <Textarea id="cv-objective" rows={3} value={value.objective} onChange={(e) => onChange({ ...value, objective: e.target.value })} />
      </Section>

      <Section
        id="cv-experiences"
        title="Kinh nghiệm làm việc"
        hint="Mỗi vị trí nên có việc đã làm, công cụ đã dùng và kết quả đo được."
        action={<AddButton label="Thêm kinh nghiệm" onClick={() => addItem("experiences", emptyExperience())} />}
      >
        {value.experiences.length === 0 && <p className="text-sm text-muted-foreground">Chưa có kinh nghiệm nào. Bấm Thêm kinh nghiệm để bắt đầu.</p>}
        {value.experiences.map((item, index) => {
          const prefix = `cv-experiences-${index}`
          return (
            <ItemBox key={index} id={prefix} label={`Kinh nghiệm ${index + 1}`} onRemove={() => removeItem("experiences", index)}>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField id={`${prefix}-position`} label="Chức danh">
                  <Input id={`${prefix}-position`} className="h-11" value={item.position} onChange={(e) => patchItem("experiences", index, { position: e.target.value })} />
                </FormField>
                <FormField id={`${prefix}-company`} label="Công ty">
                  <Input id={`${prefix}-company`} className="h-11" value={item.company} onChange={(e) => patchItem("experiences", index, { company: e.target.value })} />
                </FormField>
              </div>
              <PeriodFields idPrefix={prefix} start={item.start} end={item.end} onChange={(patch) => patchItem("experiences", index, patch)} />
              <FormField id={`${prefix}-description`} label="Mô tả công việc">
                <Textarea id={`${prefix}-description`} rows={4} value={item.description} onChange={(e) => patchItem("experiences", index, { description: e.target.value })} />
              </FormField>
            </ItemBox>
          )
        })}
      </Section>

      <Section
        id="cv-educations"
        title="Học vấn"
        action={<AddButton label="Thêm học vấn" onClick={() => addItem("educations", emptyEducation())} />}
      >
        {value.educations.length === 0 && <p className="text-sm text-muted-foreground">Chưa có thông tin học vấn. Bấm Thêm học vấn để bắt đầu.</p>}
        {value.educations.map((item, index) => {
          const prefix = `cv-educations-${index}`
          return (
            <ItemBox key={index} id={prefix} label={`Học vấn ${index + 1}`} onRemove={() => removeItem("educations", index)}>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField id={`${prefix}-school`} label="Trường">
                  <Input id={`${prefix}-school`} className="h-11" value={item.school} onChange={(e) => patchItem("educations", index, { school: e.target.value })} />
                </FormField>
                <FormField id={`${prefix}-major`} label="Chuyên ngành">
                  <Input id={`${prefix}-major`} className="h-11" value={item.major} onChange={(e) => patchItem("educations", index, { major: e.target.value })} />
                </FormField>
                <FormField id={`${prefix}-degree`} label="Bằng cấp">
                  <Input id={`${prefix}-degree`} className="h-11" placeholder="Ví dụ: Cử nhân" value={item.degree} onChange={(e) => patchItem("educations", index, { degree: e.target.value })} />
                </FormField>
                <FormField id={`${prefix}-gpa`} label="Điểm trung bình">
                  <Input id={`${prefix}-gpa`} className="h-11" placeholder="Ví dụ: 3.2/4" value={item.gpa ?? ""} onChange={(e) => patchItem("educations", index, { gpa: e.target.value || null })} />
                </FormField>
              </div>
              <PeriodFields idPrefix={prefix} start={item.start} end={item.end} onChange={(patch) => patchItem("educations", index, patch)} />
            </ItemBox>
          )
        })}
      </Section>

      <Section id="cv-skills-section" title="Kỹ năng" hint="Kỹ năng trùng với từ điển của hệ thống mới được tính khi so khớp với tin tuyển dụng.">
        <SkillsInput id="cv-skills" value={value.skills} onChange={(skills) => onChange({ ...value, skills })} />
      </Section>

      <Section
        id="cv-projects"
        title="Dự án"
        action={<AddButton label="Thêm dự án" onClick={() => addItem("projects", emptyProject())} />}
      >
        {value.projects.length === 0 && <p className="text-sm text-muted-foreground">Chưa có dự án nào. Sinh viên mới ra trường nên thêm đồ án và dự án môn học.</p>}
        {value.projects.map((item, index) => {
          const prefix = `cv-projects-${index}`
          return (
            <ItemBox key={index} id={prefix} label={`Dự án ${index + 1}`} onRemove={() => removeItem("projects", index)}>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField id={`${prefix}-name`} label="Tên dự án">
                  <Input id={`${prefix}-name`} className="h-11" value={item.name} onChange={(e) => patchItem("projects", index, { name: e.target.value })} />
                </FormField>
                <FormField id={`${prefix}-role`} label="Vai trò">
                  <Input id={`${prefix}-role`} className="h-11" value={item.role} onChange={(e) => patchItem("projects", index, { role: e.target.value })} />
                </FormField>
              </div>
              <PeriodFields idPrefix={prefix} start={item.start} end={item.end} onChange={(patch) => patchItem("projects", index, patch)} />
              <FormField id={`${prefix}-description`} label="Mô tả">
                <Textarea id={`${prefix}-description`} rows={3} value={item.description} onChange={(e) => patchItem("projects", index, { description: e.target.value })} />
              </FormField>
              <FormField id={`${prefix}-link`} label="Đường dẫn">
                <Input id={`${prefix}-link`} className="h-11" placeholder="https://" value={item.link ?? ""} onChange={(e) => patchItem("projects", index, { link: e.target.value || null })} />
              </FormField>
            </ItemBox>
          )
        })}
      </Section>

      <Section
        id="cv-certificates"
        title="Chứng chỉ"
        action={<AddButton label="Thêm chứng chỉ" onClick={() => addItem("certificates", emptyCertificate())} />}
      >
        {value.certificates.length === 0 && <p className="text-sm text-muted-foreground">Chưa có chứng chỉ nào.</p>}
        {value.certificates.map((item, index) => {
          const prefix = `cv-certificates-${index}`
          return (
            <ItemBox key={index} id={prefix} label={`Chứng chỉ ${index + 1}`} onRemove={() => removeItem("certificates", index)}>
              <div className="grid gap-4 sm:grid-cols-[1fr_1fr_120px]">
                <FormField id={`${prefix}-name`} label="Tên chứng chỉ">
                  <Input id={`${prefix}-name`} className="h-11" value={item.name} onChange={(e) => patchItem("certificates", index, { name: e.target.value })} />
                </FormField>
                <FormField id={`${prefix}-issuer`} label="Nơi cấp">
                  <Input id={`${prefix}-issuer`} className="h-11" value={item.issuer} onChange={(e) => patchItem("certificates", index, { issuer: e.target.value })} />
                </FormField>
                <FormField id={`${prefix}-year`} label="Năm">
                  <Input id={`${prefix}-year`} type="number" min={1950} max={2100} className="h-11 tabular-nums" value={item.year ?? ""} onChange={(e) => patchItem("certificates", index, { year: e.target.value ? Number(e.target.value) : null })} />
                </FormField>
              </div>
            </ItemBox>
          )
        })}
      </Section>

      <Section id="cv-strengths-section" title="Điểm mạnh" hint="Nêu việc cụ thể chứng minh điểm mạnh, tránh các từ chung chung như chăm chỉ, ham học hỏi.">
        <Textarea id="cv-strengths" rows={3} value={value.strengths} onChange={(e) => onChange({ ...value, strengths: e.target.value })} />
      </Section>
    </>
  )
}
