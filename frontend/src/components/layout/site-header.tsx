import { ChevronDown, LogOut, Menu, Moon, Sparkles, Sun, X } from "lucide-react"
import { useState } from "react"
import { Link, NavLink, useNavigate } from "react-router-dom"

import { ButtonLink } from "@/components/common/button-link"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/features/auth/auth-context"
import { cn } from "@/lib/utils"
import { useTheme } from "@/lib/theme"
import type { Role } from "@/types/api"

const MAIN_NAV = [
  { to: "/viec-lam", label: "Việc làm" },
  { to: "/viec-phu-hop", label: "Việc phù hợp với CV" },
]

const ROLE_LABELS: Record<Role, string> = { candidate: "Ứng viên", employer: "Nhà tuyển dụng", admin: "Quản trị viên" }

export function Logo({ className }: { className?: string }) {
  return (
    <Link to="/" className={cn("font-heading text-[22px] font-extrabold uppercase tracking-tight", className)}>
      Khớp<span className="text-brand">Việc</span>
    </Link>
  )
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/)
  return ((parts.at(-2)?.[0] ?? "") + (parts.at(-1)?.[0] ?? "")).toUpperCase()
}

function UserMenu() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  if (!user) return null
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="ghost" className="h-11 gap-2.5 px-2" aria-label="Menu tài khoản" />}>
        <Avatar size="lg">
          <AvatarFallback className="bg-accent text-[13px] font-semibold text-accent-foreground">{initials(user.full_name)}</AvatarFallback>
        </Avatar>
        <span className="hidden text-left leading-tight md:block">
          <span className="block text-sm font-semibold">{user.full_name}</span>
          <span className="block text-xs text-muted-foreground">{ROLE_LABELS[user.role]}</span>
        </span>
        <ChevronDown className="hidden size-4 text-muted-foreground md:block" aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {user.role === "candidate" && (
          <>
            <DropdownMenuItem render={<Link to="/viec-phu-hop" />}>
              <Sparkles /> Việc phù hợp với CV
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuItem
          onClick={() => {
            logout()
            navigate("/")
          }}
        >
          <LogOut /> Đăng xuất
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function SiteHeader() {
  const { user } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [menuOpen, setMenuOpen] = useState(false)

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    cn("text-[15px] font-semibold transition-colors hover:text-primary", isActive && "text-primary")

  return (
    <header className="sticky top-0 z-40 border-b bg-card">
      <div className="mx-auto flex h-18 max-w-7xl items-center gap-6 px-4 sm:px-6 lg:px-8">
        <Logo />

        <nav aria-label="Điều hướng chính" className="ml-auto hidden items-center gap-7 lg:flex">
          {MAIN_NAV.map((item) => (
            <NavLink key={item.to} to={item.to} className={navLinkClass}>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2 lg:ml-4">
          <Button
            variant="ghost"
            size="icon-lg"
            onClick={toggleTheme}
            aria-label={theme === "dark" ? "Chuyển sang giao diện sáng" : "Chuyển sang giao diện tối"}
          >
            {theme === "dark" ? <Sun /> : <Moon />}
          </Button>
          {user ? (
            <UserMenu />
          ) : (
            <>
              <ButtonLink to="/dang-nhap" variant="ghost" className="hidden h-10 px-3 text-[15px] font-semibold sm:inline-flex">
                Đăng nhập
              </ButtonLink>
              <ButtonLink to="/dang-ky" className="hidden h-11 px-5 font-bold uppercase sm:inline-flex">
                Đăng ký
              </ButtonLink>
            </>
          )}
          <Button
            variant="ghost"
            size="icon-lg"
            className="lg:hidden"
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
            aria-label={menuOpen ? "Đóng menu" : "Mở menu"}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X /> : <Menu />}
          </Button>
        </div>
      </div>

      {menuOpen && (
        <nav id="mobile-nav" aria-label="Điều hướng chính" className="border-t bg-card px-4 py-3 lg:hidden">
          <ul className="grid gap-1">
            {MAIN_NAV.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) => cn("block rounded-md px-3 py-2.5 font-semibold hover:bg-muted", isActive && "text-primary")}
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
          {!user && (
            <div className="mt-3 grid grid-cols-2 gap-2 border-t pt-3">
              <ButtonLink to="/dang-nhap" onClick={() => setMenuOpen(false)} variant="outline" className="h-10">
                Đăng nhập
              </ButtonLink>
              <ButtonLink to="/dang-ky" onClick={() => setMenuOpen(false)} className="h-10 font-bold uppercase">
                Đăng ký
              </ButtonLink>
            </div>
          )}
        </nav>
      )}
    </header>
  )
}
