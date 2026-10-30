import { useState, type FormEvent } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"

import { FormError, FormField } from "@/components/common/form-field"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/features/auth/auth-context"
import type { Role } from "@/types/api"
import { AuthLayout } from "./auth-layout"

const DEMO_ACCOUNTS = [
  { email: "an.nguyen@khopviec.vn", label: "Ứng viên", note: "Nguyễn Văn An, frontend" },
  { email: "chau.le@khopviec.vn", label: "Ứng viên", note: "Lê Minh Châu, CV chưa tốt" },
  { email: "tuyendung01@khopviec.vn", label: "Nhà tuyển dụng", note: "Công ty CP Công nghệ Sao Mai" },
  { email: "admin@khopviec.vn", label: "Quản trị viên", note: "" },
]
const DEMO_PASSWORD = "Matkhau@123"

export const HOME_BY_ROLE: Record<Role, string> = {
  candidate: "/viec-phu-hop",
  employer: "/",
  admin: "/",
}

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const user = await login(email.trim(), password)
      navigate(params.get("tiep") || HOME_BY_ROLE[user.role], { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đăng nhập không thành công")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout
      title="Đăng nhập"
      description={
        <>
          Chưa có tài khoản?{" "}
          <Link to="/dang-ky" className="font-semibold text-primary hover:underline">
            Đăng ký miễn phí
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="grid gap-5">
        <FormError message={error} />
        <FormField id="email" label="Email">
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-11"
          />
        </FormField>
        <FormField id="password" label="Mật khẩu">
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-11"
          />
        </FormField>
        <Button type="submit" disabled={submitting} className="h-12 font-bold uppercase">
          {submitting ? "Đang đăng nhập…" : "Đăng nhập"}
        </Button>
      </form>

      <div className="mt-10 rounded-lg border bg-muted p-4">
        <p className="text-[13px] font-semibold text-muted-foreground">
          Tài khoản demo · mật khẩu <span className="font-mono text-foreground">{DEMO_PASSWORD}</span>
        </p>
        <ul className="mt-3 grid gap-1">
          {DEMO_ACCOUNTS.map((acc) => (
            <li key={acc.email}>
              <button
                type="button"
                onClick={() => {
                  setEmail(acc.email)
                  setPassword(DEMO_PASSWORD)
                }}
                className="flex w-full flex-wrap items-baseline gap-x-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-card"
              >
                <span className="font-semibold">{acc.label}</span>
                <span className="text-muted-foreground">{acc.email}</span>
                {acc.note && <span className="text-[13px] text-muted-foreground">· {acc.note}</span>}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </AuthLayout>
  )
}
