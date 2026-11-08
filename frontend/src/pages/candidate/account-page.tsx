import { useState, type FormEvent } from "react"
import { toast } from "sonner"

import { FormError, FormField } from "@/components/common/form-field"
import { SelectField, type SelectOption } from "@/components/common/select-field"
import { ErrorState } from "@/components/common/states"
import { PageBanner } from "@/components/layout/page-banner"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { useChangePassword, useProfile, useUpdateAccount, useUpdateProfile } from "@/features/account/queries"
import { useAuth } from "@/features/auth/auth-context"
import { useCategories, useCities } from "@/features/catalog/queries"
import { EDUCATION_LABELS, GENDER_LABELS } from "@/lib/labels"
import type { EducationLevel, Gender, Profile, User } from "@/types/api"

// Select không nhận giá trị rỗng làm một lựa chọn nên dùng ký hiệu riêng cho "chưa chọn"
const UNSET = "_"
const unsetOption = (label: string): SelectOption => ({ value: UNSET, label })
const fromSelect = (value: string) => (value === UNSET ? null : value)
const emptyToNull = (value: string) => value.trim() || null

const GENDER_OPTIONS = [unsetOption("Chưa chọn"), ...Object.entries(GENDER_LABELS).map(([value, label]) => ({ value, label }))]
const EDUCATION_OPTIONS = [
  unsetOption("Chưa chọn"),
  ...Object.entries({ ...EDUCATION_LABELS, none: "Chưa có bằng cấp" }).map(([value, label]) => ({ value, label })),
]

function CardTitle({ title, description }: { title: string; description?: string }) {
  return (
    <div>
      <h2 className="text-lg font-bold">{title}</h2>
      {description && <p className="mt-1 text-[13px] text-muted-foreground">{description}</p>}
    </div>
  )
}

function AccountCard({ user }: { user: User }) {
  const update = useUpdateAccount()
  const [fullName, setFullName] = useState(user.full_name)
  const [phone, setPhone] = useState(user.phone ?? "")
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (fullName.trim().length < 2) {
      setError("Họ và tên cần ít nhất 2 ký tự")
      return
    }
    setError(null)
    update.mutate(
      { full_name: fullName.trim(), phone: emptyToNull(phone) },
      { onSuccess: () => toast.success("Đã lưu thông tin tài khoản"), onError: (err) => setError(err.message) },
    )
  }

  return (
    <Card className="p-5 sm:p-6">
      <form onSubmit={handleSubmit} className="grid gap-4">
        <CardTitle title="Thông tin tài khoản" />
        <FormError message={error} />
        <FormField id="account-email" label="Email" hint="Email dùng để đăng nhập, không đổi được.">
          <Input id="account-email" className="h-11" value={user.email} disabled />
        </FormField>
        <FormField id="account-name" label="Họ và tên">
          <Input id="account-name" className="h-11" autoComplete="name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </FormField>
        <FormField id="account-phone" label="Số điện thoại">
          <Input id="account-phone" type="tel" className="h-11" autoComplete="tel" maxLength={20} value={phone} onChange={(e) => setPhone(e.target.value)} />
        </FormField>
        <Button type="submit" disabled={update.isPending} className="h-11 font-bold uppercase">
          {update.isPending ? "Đang lưu…" : "Lưu thông tin"}
        </Button>
      </form>
    </Card>
  )
}

function PasswordCard() {
  const change = useChangePassword()
  const [current, setCurrent] = useState("")
  const [next, setNext] = useState("")
  const [confirm, setConfirm] = useState("")
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (next.length < 8) {
      setError("Mật khẩu mới cần ít nhất 8 ký tự")
      return
    }
    if (next !== confirm) {
      setError("Hai ô mật khẩu mới chưa giống nhau")
      return
    }
    setError(null)
    change.mutate(
      { current_password: current, new_password: next },
      {
        onSuccess: () => {
          setCurrent("")
          setNext("")
          setConfirm("")
          toast.success("Đã đổi mật khẩu")
        },
        onError: (err) => setError(err.message),
      },
    )
  }

  return (
    <Card className="p-5 sm:p-6">
      <form onSubmit={handleSubmit} className="grid gap-4">
        <CardTitle title="Đổi mật khẩu" />
        <FormError message={error} />
        <FormField id="password-current" label="Mật khẩu hiện tại">
          <Input id="password-current" type="password" autoComplete="current-password" required className="h-11" value={current} onChange={(e) => setCurrent(e.target.value)} />
        </FormField>
        <FormField id="password-new" label="Mật khẩu mới" hint="Ít nhất 8 ký tự.">
          <Input id="password-new" type="password" autoComplete="new-password" required className="h-11" value={next} onChange={(e) => setNext(e.target.value)} />
        </FormField>
        <FormField id="password-confirm" label="Nhập lại mật khẩu mới">
          <Input id="password-confirm" type="password" autoComplete="new-password" required className="h-11" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        </FormField>
        <Button type="submit" disabled={change.isPending} variant="outline" className="h-11 font-bold uppercase">
          {change.isPending ? "Đang đổi…" : "Đổi mật khẩu"}
        </Button>
      </form>
    </Card>
  )
}

function ProfileForm({ profile }: { profile: Profile }) {
  const update = useUpdateProfile()
  const { data: cities = [] } = useCities()
  const { data: categories = [] } = useCategories()
  const [form, setForm] = useState({
    headline: profile.headline ?? "",
    date_of_birth: profile.date_of_birth ?? "",
    gender: profile.gender ?? UNSET,
    address: profile.address ?? "",
    city_id: profile.city_id ? String(profile.city_id) : UNSET,
    desired_category_id: profile.desired_category_id ? String(profile.desired_category_id) : UNSET,
    desired_salary_min: profile.desired_salary_min ?? "",
    desired_salary_max: profile.desired_salary_max ?? "",
    years_of_experience: profile.years_of_experience ?? "",
    education_level: profile.education_level ?? UNSET,
    summary: profile.summary ?? "",
    is_searchable: profile.is_searchable,
  })
  const [error, setError] = useState<string | null>(null)

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => setForm((f) => ({ ...f, [key]: value }))
  const cityOptions = [unsetOption("Chưa chọn"), ...cities.map((c) => ({ value: String(c.id), label: c.name }))]
  const categoryOptions = [
    unsetOption("Chưa chọn"),
    ...categories.flatMap((parent) => [
      { value: String(parent.id), label: parent.name },
      ...parent.children.map((child) => ({ value: String(child.id), label: `${parent.name} / ${child.name}` })),
    ]),
  ]

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const min = form.desired_salary_min === "" ? null : Number(form.desired_salary_min)
    const max = form.desired_salary_max === "" ? null : Number(form.desired_salary_max)
    if (min && max && max < min) {
      setError("Lương mong muốn tối đa phải lớn hơn hoặc bằng mức tối thiểu")
      return
    }
    setError(null)
    const cityId = fromSelect(form.city_id)
    const categoryId = fromSelect(form.desired_category_id)
    update.mutate(
      {
        headline: emptyToNull(form.headline),
        date_of_birth: form.date_of_birth || null,
        gender: fromSelect(form.gender) as Gender | null,
        address: emptyToNull(form.address),
        city_id: cityId ? Number(cityId) : null,
        desired_category_id: categoryId ? Number(categoryId) : null,
        desired_salary_min: form.desired_salary_min || null,
        desired_salary_max: form.desired_salary_max || null,
        years_of_experience: form.years_of_experience || null,
        education_level: fromSelect(form.education_level) as EducationLevel | null,
        summary: emptyToNull(form.summary),
        is_searchable: form.is_searchable,
      },
      { onSuccess: () => toast.success("Đã lưu hồ sơ"), onError: (err) => setError(err.message) },
    )
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <CardTitle title="Hồ sơ tìm việc" description="Kinh nghiệm, học vấn và địa điểm được dùng để tính điểm phù hợp với tin tuyển dụng." />
      <FormError message={error} />
      <FormField id="profile-headline" label="Chức danh">
        <Input id="profile-headline" className="h-11" maxLength={200} placeholder="Ví dụ: Frontend Developer" value={form.headline} onChange={(e) => set("headline", e.target.value)} />
      </FormField>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField id="profile-dob" label="Ngày sinh">
          <Input id="profile-dob" type="date" className="h-11" value={form.date_of_birth} onChange={(e) => set("date_of_birth", e.target.value)} />
        </FormField>
        <FormField id="profile-gender" label="Giới tính">
          <SelectField id="profile-gender" value={form.gender} onChange={(v) => set("gender", v as typeof form.gender)} options={GENDER_OPTIONS} />
        </FormField>
        <FormField id="profile-city" label="Tỉnh/thành đang sống">
          <SelectField id="profile-city" value={form.city_id} onChange={(v) => set("city_id", v)} options={cityOptions} />
        </FormField>
        <FormField id="profile-address" label="Địa chỉ">
          <Input id="profile-address" className="h-11" maxLength={255} value={form.address} onChange={(e) => set("address", e.target.value)} />
        </FormField>
        <FormField id="profile-years" label="Số năm kinh nghiệm">
          <Input id="profile-years" type="number" min={0} max={60} step={0.5} className="h-11 tabular-nums" value={form.years_of_experience} onChange={(e) => set("years_of_experience", e.target.value)} />
        </FormField>
        <FormField id="profile-education" label="Trình độ học vấn">
          <SelectField id="profile-education" value={form.education_level} onChange={(v) => set("education_level", v as typeof form.education_level)} options={EDUCATION_OPTIONS} />
        </FormField>
        <FormField id="profile-salary-min" label="Lương mong muốn từ (triệu)">
          <Input id="profile-salary-min" type="number" min={0} step={0.5} className="h-11 tabular-nums" value={form.desired_salary_min} onChange={(e) => set("desired_salary_min", e.target.value)} />
        </FormField>
        <FormField id="profile-salary-max" label="Đến (triệu)">
          <Input id="profile-salary-max" type="number" min={0} step={0.5} className="h-11 tabular-nums" value={form.desired_salary_max} onChange={(e) => set("desired_salary_max", e.target.value)} />
        </FormField>
      </div>
      <FormField id="profile-category" label="Ngành nghề mong muốn">
        <SelectField id="profile-category" value={form.desired_category_id} onChange={(v) => set("desired_category_id", v)} options={categoryOptions} />
      </FormField>
      <FormField id="profile-summary" label="Giới thiệu ngắn">
        <Textarea id="profile-summary" rows={4} value={form.summary} onChange={(e) => set("summary", e.target.value)} />
      </FormField>
      <Label className="flex cursor-pointer items-center gap-3 font-normal">
        <Checkbox checked={form.is_searchable} onCheckedChange={(checked) => set("is_searchable", Boolean(checked))} />
        Cho phép nhà tuyển dụng tìm thấy hồ sơ của tôi
      </Label>
      <Button type="submit" disabled={update.isPending} className="h-11 font-bold uppercase">
        {update.isPending ? "Đang lưu…" : "Lưu hồ sơ"}
      </Button>
    </form>
  )
}

function ProfileCard() {
  const { data: profile, error, isLoading } = useProfile()
  if (error) return <ErrorState error={error} />
  if (isLoading || !profile) return <Skeleton className="h-96 rounded-lg" />
  return (
    <Card className="p-5 sm:p-6">
      <ProfileForm profile={profile} />
    </Card>
  )
}

export function AccountPage() {
  const { user } = useAuth()
  if (!user) return null
  const isCandidate = user.role === "candidate"

  return (
    <main>
      <PageBanner
        title={isCandidate ? "Tài khoản và hồ sơ" : "Tài khoản"}
        breadcrumb={[{ to: "/", label: "Trang chủ" }, { label: "Tài khoản" }]}
        description={isCandidate ? "Cập nhật thông tin liên hệ, hồ sơ tìm việc và mật khẩu." : "Cập nhật thông tin liên hệ và mật khẩu."}
      />
      <div className={isCandidate ? "mx-auto grid max-w-7xl items-start gap-5 px-4 pt-8 pb-16 sm:px-6 lg:grid-cols-[minmax(0,1fr)_400px] lg:px-8" : "mx-auto grid max-w-xl gap-5 px-4 pt-8 pb-16 sm:px-6"}>
        {isCandidate && <ProfileCard />}
        <div className="grid gap-5">
          <AccountCard user={user} />
          <PasswordCard />
        </div>
      </div>
    </main>
  )
}
