import { useCallback, useSyncExternalStore } from "react"

export type Theme = "light" | "dark"

const STORAGE_KEY = "theme"
// Mặc định giao diện sáng, chỉ tối khi người dùng tự bấm chuyển
const DEFAULT_THEME: Theme = "light"

function readStoredTheme(): Theme {
  try {
    const value = localStorage.getItem(STORAGE_KEY)
    return value === "light" || value === "dark" ? value : DEFAULT_THEME
  } catch {
    return DEFAULT_THEME
  }
}

// Một nguồn trạng thái chung để header, toast… luôn cùng một theme
let current: Theme = typeof window === "undefined" ? DEFAULT_THEME : readStoredTheme()
const listeners = new Set<() => void>()

function setTheme(next: Theme) {
  current = next
  document.documentElement.classList.toggle("dark", next === "dark")
  try {
    localStorage.setItem(STORAGE_KEY, next)
  } catch {
    // Trình duyệt chặn localStorage: vẫn đổi được, chỉ không nhớ lại
  }
  listeners.forEach((l) => l())
}

// Gọi trước khi render để tránh nháy sai màu lúc tải trang
export function applyInitialTheme() {
  document.documentElement.classList.toggle("dark", current === "dark")
}

export function useTheme() {
  const theme = useSyncExternalStore(
    (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    () => current,
  )
  const toggleTheme = useCallback(() => setTheme(current === "dark" ? "light" : "dark"), [])
  return { theme, toggleTheme }
}
