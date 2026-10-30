import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { MatchSkill } from "@/types/api"
import { toPercent } from "../match-level"

type SkillRequirementsProps = {
  skills: MatchSkill[]
  coverage: number
  requiredMet: number
  requiredTotal: number
}

export function SkillRequirements({ skills, coverage, requiredMet, requiredTotal }: SkillRequirementsProps) {
  const missingRequired = skills.filter((s) => s.required && !s.matched)
  return (
    <div className="grid gap-3">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="h-8 px-0 text-xs text-muted-foreground">Kỹ năng</TableHead>
            <TableHead className="h-8 text-xs text-muted-foreground">Loại</TableHead>
            <TableHead className="h-8 px-0 text-right text-xs text-muted-foreground">Trong CV</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {skills.map((skill) => (
            <TableRow key={skill.skill_id} className="hover:bg-transparent">
              <TableCell className="px-0 font-medium">{skill.name}</TableCell>
              <TableCell className="text-xs text-muted-foreground">{skill.required ? "Bắt buộc" : "Ưu tiên"}</TableCell>
              <TableCell className="px-0 text-right">
                {skill.matched ? (
                  <Badge variant="success">Có</Badge>
                ) : (
                  <Badge variant={skill.required ? "danger" : "warning"}>Chưa thấy</Badge>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <p className="text-[13px] text-muted-foreground">
        Đáp ứng{" "}
        <strong className="font-semibold text-foreground tabular-nums">
          {requiredMet}/{requiredTotal}
        </strong>{" "}
        kỹ năng bắt buộc, tỷ lệ đáp ứng có trọng số{" "}
        <strong className="font-semibold text-foreground tabular-nums">{toPercent(coverage)}%</strong>.
      </p>
      {missingRequired.length > 0 && (
        <p className="rounded-md bg-warning-soft px-3 py-2.5 text-[13px] text-warning">
          Nên bổ sung trước khi ứng tuyển: <strong className="font-semibold">{missingRequired.map((s) => s.name).join(", ")}</strong>. Nếu
          bạn đã có kỹ năng này, hãy ghi rõ trong CV.
        </p>
      )}
    </div>
  )
}
