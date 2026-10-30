import { Link } from "react-router-dom"

const FOOTER_LINKS = [
  {
    title: "Dành cho ứng viên",
    links: [
      { to: "/viec-lam", label: "Tìm việc làm" },
      { to: "/viec-phu-hop", label: "Việc phù hợp với CV" },
      { to: "/cv", label: "Tạo và sửa CV" },
      { to: "/ho-so-da-nop", label: "Hồ sơ đã nộp" },
    ],
  },
  {
    title: "Dành cho nhà tuyển dụng",
    links: [
      { to: "/nha-tuyen-dung/dang-tin", label: "Đăng tin tuyển dụng" },
      { to: "/nha-tuyen-dung/ung-vien", label: "Quản lý ứng viên" },
      { to: "/nha-tuyen-dung/cong-ty", label: "Hồ sơ công ty" },
    ],
  },
]

export function SiteFooter() {
  return (
    <footer>
      <div className="bg-primary text-primary-foreground">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr] lg:px-8">
          <div className="max-w-sm">
            <p className="font-heading text-[22px] font-extrabold uppercase tracking-tight">KhớpViệc</p>
            <p className="mt-4 leading-relaxed opacity-95">
              Website tuyển dụng có gợi ý việc làm theo CV: so khớp kỹ năng, chỉ ra kỹ năng còn thiếu và gợi ý cách sửa CV cho từng vị trí.
            </p>
          </div>
          {FOOTER_LINKS.map((group) => (
            <div key={group.title}>
              <h2 className="text-[15px] font-bold uppercase">{group.title}</h2>
              <ul className="mt-4 grid gap-2.5">
                {group.links.map((link) => (
                  <li key={link.to}>
                    <Link to={link.to} className="opacity-95 hover:underline hover:opacity-100">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-hero text-hero-foreground">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-4 text-sm sm:px-6 lg:px-8">
          <p>© 2026 KhớpViệc · Đồ án tốt nghiệp</p>
          <p className="flex gap-4 opacity-80">
            <Link to="/dieu-khoan" className="hover:underline">
              Điều khoản
            </Link>
            <Link to="/bao-mat" className="hover:underline">
              Chính sách bảo mật
            </Link>
          </p>
        </div>
      </div>
    </footer>
  )
}
