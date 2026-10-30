import { ButtonLink } from "@/components/common/button-link"

export function AudienceSplit() {
  return (
    <section className="grid md:grid-cols-2">
      <div className="bg-hero bg-dots px-6 py-16 text-hero-foreground sm:px-12 lg:py-20">
        <div className="ml-auto max-w-lg md:text-right">
          <h2 className="text-[28px] font-bold sm:text-[34px]">Bạn đang tìm việc?</h2>
          <p className="mt-4 leading-relaxed opacity-85">
            Tạo hồ sơ một lần, ứng tuyển nhiều nơi và theo dõi trạng thái từng hồ sơ: đã xem, hẹn phỏng vấn, kết quả.
          </p>
          <ButtonLink
            variant="outline"
            to="/dang-ky"
            className="mt-8 h-12 border-hero-foreground/40 bg-transparent px-6 font-bold text-hero-foreground uppercase hover:bg-hero-foreground hover:text-hero dark:bg-transparent"
          >
            Tạo tài khoản ứng viên
          </ButtonLink>
        </div>
      </div>
      <div className="bg-primary px-6 py-16 text-primary-foreground sm:px-12 lg:py-20">
        <div className="max-w-lg">
          <h2 className="text-[28px] font-bold sm:text-[34px]">Bạn cần tuyển người?</h2>
          <p className="mt-4 leading-relaxed opacity-95">
            Đăng tin miễn phí, nhận hồ sơ đã được chấm điểm phù hợp và lọc ứng viên theo kỹ năng bắt buộc.
          </p>
          <ButtonLink to="/dang-ky" className="mt-8 h-12 bg-white px-6 font-bold text-primary uppercase hover:bg-white/90">
            Đăng tin tuyển dụng
          </ButtonLink>
        </div>
      </div>
    </section>
  )
}
