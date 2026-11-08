// Định dạng hiển thị theo quy ước tiếng Việt trong CLAUDE.md

type NumberLike = number | string | null | undefined

const toNumber = (value: NumberLike) => (value === null || value === undefined || value === "" ? null : Number(value))

/** 15.5 -> "15,5"; 15.0 -> "15" */
export function formatNumber(value: NumberLike): string {
  const n = toNumber(value)
  if (n === null) return ""
  return n.toLocaleString("vi-VN", { maximumFractionDigits: 1 })
}

export function formatDate(iso: string): string {
  const [year, month, day] = iso.slice(0, 10).split("-")
  return `${day}/${month}/${year}`
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${pad(d.getHours())}:${pad(d.getMinutes())}, ${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`
}

/** "2024-09" -> "09/2024" */
export function formatMonth(value: string | null | undefined): string {
  if (!value) return ""
  const [year, month] = value.split("-")
  return month ? `${month}/${year}` : year
}

/** Khoảng thời gian trên CV: "09/2024 – 02/2025", chưa có ngày kết thúc thì ghi "nay" */
export function formatPeriod(start: string | null | undefined, end: string | null | undefined): string {
  if (!start && !end) return ""
  return `${formatMonth(start)} – ${end ? formatMonth(end) : "nay"}`
}

/** 1536000 -> "1,5 MB" */
export function formatFileSize(bytes: number | null | undefined): string {
  if (!bytes) return ""
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${formatNumber(bytes / (1024 * 1024))} MB`
}

export function formatSalary(min: NumberLike, max: NumberLike): string {
  const lo = toNumber(min)
  const hi = toNumber(max)
  if (lo === null && hi === null) return "Thỏa thuận"
  if (lo === null) return `Đến ${formatNumber(hi)} triệu`
  if (hi === null) return `Từ ${formatNumber(lo)} triệu`
  return `${formatNumber(lo)}–${formatNumber(hi)} triệu`
}

export function formatExperience(min: NumberLike, max: NumberLike): string {
  const lo = toNumber(min) ?? 0
  const hi = toNumber(max)
  if (lo === 0 && hi === null) return "Không yêu cầu"
  if (hi === null) return `Từ ${formatNumber(lo)} năm`
  if (lo === hi) return `${formatNumber(lo)} năm`
  return `${formatNumber(lo)}–${formatNumber(hi)} năm`
}

export function daysUntil(iso: string, today = new Date()): number {
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const end = new Date(`${iso.slice(0, 10)}T00:00:00`)
  return Math.round((end.getTime() - start.getTime()) / 86_400_000)
}

/** "2 giờ trước", "3 ngày trước" */
export function timeAgo(iso: string | null): string {
  if (!iso) return ""
  const minutes = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60_000))
  if (minutes < 60) return `${Math.max(minutes, 1)} phút trước`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours} giờ trước`
  const days = Math.round(hours / 24)
  if (days < 30) return `${days} ngày trước`
  return formatDate(iso)
}

/** Tách nội dung dạng "- dòng 1\n- dòng 2" thành danh sách */
export function toBulletLines(text: string | null | undefined): string[] {
  return (text ?? "")
    .split("\n")
    .map((line) => line.replace(/^\s*[-•*]\s*/, "").trim())
    .filter(Boolean)
}
