# CLAUDE.md

Hướng dẫn cho Claude khi làm việc trong dự án này. Đọc hết file trước khi viết code hoặc giao diện.

## Dự án

Website tuyển dụng, đồ án tốt nghiệp. Có 3 vai trò: **ứng viên**, **nhà tuyển dụng**, **quản trị viên**.

Điểm nhấn của đề tài là phần so khớp CV với tin tuyển dụng:
1. **Top 10 việc phù hợp với CV**: tính điểm tổng hợp, xếp hạng, hiển thị điểm thành phần để giải thích kết quả.
2. **Phân tích kỹ năng còn thiếu**: với một job, chỉ ra kỹ năng đã có, kỹ năng chưa thấy trong CV và tỷ lệ đáp ứng.
3. **Đánh giá và gợi ý sửa CV**: kiểm tra CV theo quy tắc, gợi ý sửa theo job, xuất CV đã sửa ra PDF. CV được sửa trên **form có cấu trúc**, không sửa trực tiếp file PDF.

Nhà tuyển dụng dùng lại đúng các thuật toán này theo chiều ngược lại để xếp hạng ứng viên.

## Stack

| Phần | Công nghệ |
|---|---|
| Frontend | React 19 + Vite + TypeScript, React Router, **Tailwind CSS v4 + shadcn/ui** (style `base-nova`, chạy trên Base UI), icon Lucide, font Montserrat + Be Vietnam Pro (`@fontsource`) |
| Backend | Python 3.11+, **FastAPI**, SQLAlchemy 2.0, Alembic, Pydantic v2, JWT (PyJWT), bcrypt |
| Database | **MySQL 8**, charset `utf8mb4`, collation `utf8mb4_unicode_ci`. Thiết kế chuẩn nằm ở [database/schema.sql](database/schema.sql); model SQLAlchemy phải khớp với file này |
| Đọc CV | PyMuPDF (PDF), python-docx (DOCX) |
| NLP | underthesea (tách từ tiếng Việt), scikit-learn (TF-IDF), sentence-transformers (`paraphrase-multilingual-MiniLM-L12-v2`), numpy |
| Xuất PDF | Jinja2 template → WeasyPrint (chạy trong Docker để tránh lỗi GTK trên Windows) |
| Triển khai | Docker Compose: `frontend`, `backend`, `mysql` |

## Lệnh thường dùng

```bash
# Backend (cần backend/.env có DATABASE_URL đúng mật khẩu MySQL)
cd backend
.venv/Scripts/uvicorn app.main:app --reload    # http://localhost:8000, tài liệu API: /docs
.venv/Scripts/python -m pytest                 # unit test
.venv/Scripts/ruff check app scripts tests     # lint
.venv/Scripts/python -m scripts.evaluate run   # thực nghiệm Precision@10, NDCG@10

# Frontend (Vite chuyển /api sang http://localhost:8000; đổi bằng biến VITE_API_TARGET)
cd frontend
npm run dev        # http://localhost:5173
npm run build      # kiểm tra type + build
npx shadcn@latest add <tên-component>
```

Kiểm tra giao diện: chạy `npm run dev` và đọc console trình duyệt, không chỉ build. Liên kết trông như nút dùng `ButtonLink` (`components/common/button-link.tsx`), không dùng `<Button render={<Link />}>` vì Base UI gắn `role="button"` làm mất ngữ nghĩa liên kết.

## Cấu trúc thư mục

```
recruitment/
├─ frontend/src/
│  ├─ index.css              # theme: màu, font, bo góc — nguồn duy nhất
│  ├─ components/ui/         # component shadcn (đã chỉnh theo design system)
│  ├─ components/layout/     # SiteHeader, SiteFooter, PageBanner, SectionHeading
│  ├─ components/common/     # ButtonLink, FormField, Pager, EmptyState
│  ├─ features/<tên>/        # theo nghiệp vụ: queries.ts (React Query), components/
│  ├─ pages/                 # home-page.tsx, auth/, jobs/, candidate/, employer/, admin/
│  ├─ types/api.ts           # kiểu dữ liệu khớp backend/app/schemas.py
│  └─ lib/                   # api (fetch + token), format, labels, theme
├─ backend/
│  ├─ app/api/routes/        # auth, public, candidate, employer, admin, notifications
│  ├─ app/models.py  schemas.py  db.py
│  ├─ app/matching/          # algorithms.py (3 thuật toán + điểm tổng hợp), skills.py, text.py, semantic.py
│  ├─ app/services/          # matching.py, cv_parser.py, cv_evaluator.py, notify.py
│  ├─ scripts/evaluate.py    # thực nghiệm cho báo cáo
│  └─ tests/
├─ database/                 # schema.sql, seed.sql, README.md (ERD + mô tả bảng)
├─ data/                     # dữ liệu thực nghiệm
└─ docker-compose.yml
```

## Thuật toán so khớp

| # | Thuật toán | File | Ghi chú |
|---|---|---|---|
| 1 | Coverage kỹ năng có trọng số | `matching/algorithms.py` | Bắt buộc ×2, ưu tiên ×1. Kỹ năng chuẩn hóa qua bảng `skill_aliases` trước khi so |
| 2 | TF-IDF + cosine | `matching/algorithms.py` | Tách từ tiếng Việt bằng underthesea trước khi vector hóa |
| 3 | Sentence-BERT + cosine | `matching/semantic.py` | Embedding lưu cột `JSON` trong MySQL, tính cosine bằng numpy |

```
Điểm = 0.4 × Coverage + 0.2 × TF-IDF + 0.3 × Semantic + 0.1 × Tiêu chí (kinh nghiệm, học vấn, địa điểm)
```

- Trọng số để trong config, không hard-code, vì cần tinh chỉnh khi làm thực nghiệm. Frontend chỉ đọc trọng số để hiển thị (`MATCH_WEIGHTS` trong `features/matching/types.ts`).
- Tính sẵn embedding và vector TF-IDF khi đăng job hoặc tải CV lên (background task), không tính lại mỗi lần gợi ý.
- Top 10: SQL lọc job đang mở, đã duyệt, còn hạn → tính điểm trong Python → sắp xếp → lấy 10.
- API luôn trả về điểm thành phần, không chỉ điểm tổng. Dạng dữ liệu: kiểu `JobMatch` trong `features/matching/types.ts`.

Mức điểm (`getMatchLevel`): ≥80 "Rất phù hợp" (`success`) · 65–79 "Phù hợp" (`info`) · 50–64 "Phù hợp một phần" (`warning`) · <50 "Ít phù hợp" (`danger`).

## Design system

Phong cách tham khảo: https://aphrodite.recruitmentweb.site/ (chỉ lấy phong cách, không chép nội dung hay thương hiệu).

Trang mẫu chuẩn, mọi trang mới phải nhìn như cùng một sản phẩm với chúng:
- Trang công khai: [frontend/src/pages/home-page.tsx](frontend/src/pages/home-page.tsx) (route `/`)
- Trang chức năng: [frontend/src/pages/candidate/matched-jobs-page.tsx](frontend/src/pages/candidate/matched-jobs-page.tsx) (route `/viec-phu-hop`)

### Tinh thần
Màu chủ đạo xanh lá, rõ ràng, chuyên nghiệp. Các dải nền xen kẽ trắng / xám nhạt / xanh đậm để chia phần. Thông tin quan trọng (điểm, trạng thái, hạn nộp) phải thấy ngay khi lướt qua.

### Màu
Chỉ dùng các class màu theo token trong `src/index.css`, **không** dùng màu Tailwind cố định (`bg-green-500`, `text-gray-500`…) hay mã hex trong component. Ngoại lệ duy nhất: `text-white` / `bg-white` trên nền `primary`, `brand`, `hero`.

| Token | Dùng cho |
|---|---|
| `brand` | Xanh lá sáng (#12CD6A): số liệu lớn, icon tròn, gạch ngang dưới tiêu đề, chữ "Việc" trong logo |
| `primary` | Xanh lá đậm hơn để chữ trắng dễ đọc: nút chính, link, thanh điểm, footer |
| `hero` / `hero-foreground` | Nền xanh rất đậm: hero trang chủ, banner trang con, thanh bản quyền |
| `background` / `card` | Nền trắng |
| `muted` / `muted-foreground` | Dải nền xám nhạt xen kẽ; chữ phụ |
| `border` | Viền, đường kẻ |
| `accent` / `accent-foreground` | Nền xanh nhạt của mục đang chọn |
| `info`, `success`, `warning`, `destructive` (+ bản `-soft`) | Chỉ dùng cho trạng thái |

Mặc định giao diện sáng; chế độ tối bật bằng nút ở header (class `.dark` trên `<html>`, lưu trong localStorage). Mỗi token phải có giá trị cho cả hai chế độ.

### Chữ
- Tiêu đề (`h1`–`h3`, logo, số liệu lớn): **Montserrat** 600/700/800 (`font-heading`, tự áp cho h1–h3).
- Nội dung: **Be Vietnam Pro** 400–700 (`font-sans`, mặc định).
- Cỡ tiêu đề: hero 46px (32px trên điện thoại) · tiêu đề section 36px (28px) · banner trang con 34px (28px) · tiêu đề thẻ 18px.
- Cỡ nội dung: 12 · 13 · 14 · 15 · 16 (mặc định) · 17 (mô tả hero).
- Nút chính và nhãn nhóm (eyebrow, tiêu đề cột footer): `font-bold uppercase`.
- Con số trong cột, điểm, lương: `tabular-nums`.

### Bố cục
- Nội dung rộng tối đa `max-w-7xl`, lề `px-4 sm:px-6 lg:px-8`.
- Section trang công khai: `py-20 lg:py-24`. Xen kẽ nền: trắng → `bg-muted` → trắng; dải nhấn dùng `bg-hero bg-dots` hoặc `bg-primary`.
- Trang con luôn mở đầu bằng `PageBanner` (breadcrumb + tiêu đề + mô tả + nút hành động), nội dung bên dưới `pt-8 pb-16`.
- Tiêu đề section dùng `SectionHeading`: eyebrow xanh in hoa (tùy chọn), tiêu đề, mô tả; khi căn giữa có gạch `brand` bên dưới.
- Họa tiết nền hero/banner là `bg-dots` (chấm mờ). Muốn dùng ảnh thật thì đặt ảnh làm nền rồi phủ `bg-hero/85` lên trên.
- Bo góc theo `--radius: 0.375rem`. Card: `rounded-lg border`; thẻ bấm được thêm `hover:shadow-md`. Chỉ thanh tìm kiếm hero và khối minh họa được `shadow-xl`.

### Component
Dùng component trong `src/components/ui/` và `src/components/layout/` (`SiteHeader`, `SiteFooter`, `PageBanner`, `SectionHeading`). Khi thêm component mới bằng `npx shadcn@latest add`, chỉnh lại ngay: `ring-1` → `border`, `rounded-xl` → `rounded-lg`.

- **Button**: nút chính `h-11`/`h-12 px-6 font-bold uppercase`; `outline` viền `primary` cho hành động phụ; trên nền `hero`/`primary` dùng nút trắng; `ghost` cho nút icon. Icon đặt `data-icon="inline-start"`.
- **Badge**: `success` / `info` / `warning` / `danger` cho trạng thái; `outline` cho chip kỹ năng.
- **Trạng thái hồ sơ**: Đã nộp (`secondary`) · Đã xem (`info`) · Phỏng vấn (`warning`) · Đạt (`success`) · Từ chối (`danger`).
- **Icon tròn**: `size-20 rounded-full bg-brand text-white`, icon bên trong `size-9`.
- **JobCard** (`features/jobs/components/job-card.tsx`): thẻ việc làm dùng chung cho mọi danh sách dạng lưới.
- **Danh sách chọn được**: các dòng trong một `Card`, ngăn bằng `divide-y`; dòng đang chọn `bg-accent` + vạch `primary` 3px bên trái.
- **Table**: tiêu đề cột `text-xs text-muted-foreground`, cột số và trạng thái căn phải.
- **Icon**: Lucide; trong dòng thông tin của thẻ việc làm tô `text-primary`. Luôn có `aria-hidden` nếu chỉ để trang trí.

### Không được làm
- Gradient nhiều màu, glassmorphism, chữ có gradient.
- Emoji làm icon hoặc đánh dấu mục.
- Thêm màu nhấn thứ hai ngoài xanh lá.
- Câu chữ kiểu quảng cáo sáo rỗng ("Khám phá cơ hội tuyệt vời!", "Hành trình sự nghiệp").
- Chữ lorem ipsum: luôn viết nội dung tiếng Việt thật.

### Câu chữ trên giao diện
- Toàn bộ giao diện bằng tiếng Việt, viết hoa chữ đầu câu (không Viết Hoa Mọi Chữ). Riêng nút chính và eyebrow in hoa toàn bộ bằng class `uppercase`, không gõ chữ hoa trong code.
- Nút nói rõ việc sẽ xảy ra: "Ứng tuyển bằng CV này", "Lưu việc", không dùng "OK", "Gửi".
- Thông báo lỗi và trạng thái rỗng nói rõ sai gì và cách sửa.
- Định dạng qua `src/lib/format.ts`: ngày `dd/mm/yyyy`, lương `15–22 triệu`, số thập phân dùng dấu phẩy (`0,4`).
- Đường dẫn (route) bằng tiếng Việt không dấu: `/viec-phu-hop`, `/ho-so-da-nop`.

## Quy ước code
- Tên biến, hàm, bảng, cột: tiếng Anh. Chuỗi hiển thị: tiếng Việt. Comment: tiếng Việt, ngắn gọn.
- File frontend đặt tên kebab-case (`match-list-item.tsx`), component PascalCase.
- TypeScript `strict`, component dạng function, không dùng `any`.
- Python: type hint đầy đủ, format bằng `ruff`.
- Gọi API qua `lib/api.ts` và hook React Query trong `features/<tên>/queries.ts`; kiểu dữ liệu khai báo ở `types/api.ts`.
