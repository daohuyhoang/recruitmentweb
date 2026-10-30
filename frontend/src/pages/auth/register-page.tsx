import { useState, type FormEvent } from "react"
import { Link, useNavigate } from "react-router-dom"

import { FormError, FormField } from "@/components/common/form-field"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/features/auth/auth-context"
import { cn } from "@/lib/utils"
import { AuthLayout } from "./auth-layout"
import { HOME_BY_ROLE } from "./login-page"

const ROLES = [
  { value: "candidate", title: "Tôi tìm việc", text: "Tạo CV, nhận gợi ý việc phù hợp" },
  { value: "employer", title: "Tôi tuyển dụng", text: "Đăng tin, xem ứng viên đã chấm điểm" },
] as const

export function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [role, setRole] = useState<"candidate" | "employer">("candidate")
  const [form, setForm] = useState({ full_name: "", email: "", phone: "", password: "", company_name: "" })
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const update = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [key]: e.target.value })

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const user = await register({
        role,
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        password: form.password,
        phone: form.phone.trim() || undefined,
        company_name: role === "employer" ? form.company_name.trim() : undefined,
      })
      navigate(HOME_BY_ROLE[user.role], { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đăng ký không thành công")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout
      title="Tạo tài khoản"
      description={
        <>
          Đã có tài khoản?{" "}
          <Link to="/dang-nhap" className="font-semibold text-primary hover:underline">
            Đăng nhập
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="grid gap-5">
        <fieldset className="grid grid-cols-2 gap-3">
          <legend className="sr-only">Vai trò</legend>
          {ROLES.map((r) => (
            <label
              key={r.value}
              className={cn(
                "cursor-pointer rounded-lg border p-4 transition-colors has-focus-visible:ring-3 has-focus-visible:ring-ring/50",
                role === r.value ? "border-primary bg-accent" : "hover:bg-muted",
              )}
            >
              <input
                type="radio"
                name="role"
                value={r.value}
                checked={role === r.value}
                onChange={() => setRole(r.value)}
                className="sr-only"
              />
              <span className="block font-semibold">{r.title}</span>
              <span className="mt-1 block text-[13px] text-muted-foreground">{r.text}</span>
            </label>
          ))}
        </fieldset>

        <FormError message={error} />
        <FormField id="full_name" label="Họ và tên">
          <Input id="full_name" required value={form.full_name} onChange={update("full_name")} className="h-11" />
        </FormField>
        {role === "employer" && (
          <FormField id="company_name" label="Tên công ty" hint="Tài khoản nhà tuyển dụng cần admin duyệt trước khi đăng tin.">
            <Input id="company_name" required value={form.company_name} onChange={update("company_name")} className="h-11" />
          </FormField>
        )}
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField id="email" label="Email">
            <Input id="email" type="email" autoComplete="email" required value={form.email} onChange={update("email")} className="h-11" />
          </FormField>
          <FormField id="phone" label="Số điện thoại">
            <Input id="phone" type="tel" autoComplete="tel" value={form.phone} onChange={update("phone")} className="h-11" />
          </FormField>
        </div>
        <FormField id="password" label="Mật khẩu" hint="Ít nhất 8 ký tự.">
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={form.password}
            onChange={update("password")}
            className="h-11"
          />
        </FormField>
        <Button type="submit" disabled={submitting} className="h-12 font-bold uppercase">
          {submitting ? "Đang tạo tài khoản…" : "Tạo tài khoản"}
        </Button>
      </form>
    </AuthLayout>
  )
}
