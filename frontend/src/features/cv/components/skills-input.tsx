import { Plus, X } from "lucide-react"
import { useDeferredValue, useState, type KeyboardEvent } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useSkillOptions } from "../queries"

type SkillsInputProps = { id: string; value: string[]; onChange: (skills: string[]) => void }

export function SkillsInput({ id, value, onChange }: SkillsInputProps) {
  const [text, setText] = useState("")
  const query = useDeferredValue(text)
  const { data: options = [] } = useSkillOptions(query)

  const has = (name: string) => value.some((s) => s.toLowerCase() === name.toLowerCase())
  const suggestions = text.trim() ? options.filter((o) => !has(o.name)) : []

  function add(name: string) {
    const clean = name.trim()
    if (clean && !has(clean)) onChange([...value, clean])
    setText("")
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    // Enter ở đây là thêm kỹ năng, không phải gửi cả form
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault()
      add(text)
    }
  }

  return (
    <div className="grid gap-3">
      <Input
        id={id}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        className="h-11"
        placeholder="Nhập tên kỹ năng rồi nhấn Enter, ví dụ React, Excel"
      />
      {suggestions.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[13px] text-muted-foreground">Gợi ý:</span>
          {suggestions.map((option) => (
            <Button key={option.id} type="button" variant="outline" size="sm" onClick={() => add(option.name)}>
              <Plus data-icon="inline-start" />
              {option.name}
            </Button>
          ))}
        </div>
      )}
      {value.length > 0 && (
        <ul aria-label="Kỹ năng đã thêm" className="flex flex-wrap gap-1.5">
          {value.map((skill) => (
            <li key={skill}>
              <Badge variant="outline" className="h-7 gap-1 rounded-sm bg-muted pr-1 pl-2.5 text-[13px] font-normal">
                {skill}
                <button
                  type="button"
                  aria-label={`Bỏ kỹ năng ${skill}`}
                  onClick={() => onChange(value.filter((s) => s !== skill))}
                  className="grid size-5 place-items-center rounded-sm hover:bg-border"
                >
                  <X className="size-3.5" aria-hidden="true" />
                </button>
              </Badge>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
