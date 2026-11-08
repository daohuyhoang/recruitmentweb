import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"

export type SelectOption = { value: string; label: string }

type SelectFieldProps = {
  id?: string
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  /** Bản thấp hơn cho thanh lọc phía trên danh sách; mặc định cao bằng ô nhập trong form */
  compact?: boolean
  className?: string
  "aria-label"?: string
}

export function SelectField({ id, value, onChange, options, compact, className, "aria-label": ariaLabel }: SelectFieldProps) {
  return (
    <Select items={options} value={value} onValueChange={(next) => onChange(next ?? "")}>
      {/* Chiều cao gốc của SelectTrigger đặt qua data-[size=default], phải ghi đè đúng biến thể đó */}
      <SelectTrigger
        id={id}
        aria-label={ariaLabel}
        className={cn("bg-card", compact ? "w-auto data-[size=default]:h-9" : "w-full data-[size=default]:h-11", className)}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((item) => (
          <SelectItem key={item.value} value={item.value}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
