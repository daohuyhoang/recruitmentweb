export type MatchLevel = {
  label: string
  variant: "success" | "info" | "warning" | "danger"
}

export function getMatchLevel(score: number): MatchLevel {
  if (score >= 80) return { label: "Rất phù hợp", variant: "success" }
  if (score >= 65) return { label: "Phù hợp", variant: "info" }
  if (score >= 50) return { label: "Phù hợp một phần", variant: "warning" }
  return { label: "Ít phù hợp", variant: "danger" }
}

export const toPercent = (value: number) => Math.round(value * 100)
