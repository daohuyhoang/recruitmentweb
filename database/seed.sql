-- =====================================================================
-- KhớpViệc — Dữ liệu mẫu (chạy sau schema.sql)
-- mysql -u root -p recruitment < database/seed.sql
-- Mật khẩu mọi tài khoản demo: Matkhau@123
-- Tên công ty, người dùng đều là tên tự đặt.
-- job_vectors, cv_vectors, match_results để trống: backend sẽ tính.
-- =====================================================================

USE recruitment;
SET NAMES utf8mb4;

-- Tỉnh/thành phố
INSERT INTO cities (id, name, slug, sort_order) VALUES
  (1, 'Hà Nội', 'ha-noi', 1),
  (2, 'TP. Hồ Chí Minh', 'ho-chi-minh', 2),
  (3, 'Hải Phòng', 'hai-phong', 3),
  (4, 'Đà Nẵng', 'da-nang', 4),
  (5, 'Cần Thơ', 'can-tho', 5),
  (6, 'Huế', 'hue', 6),
  (7, 'An Giang', 'an-giang', 7),
  (8, 'Bắc Ninh', 'bac-ninh', 8),
  (9, 'Cà Mau', 'ca-mau', 9),
  (10, 'Cao Bằng', 'cao-bang', 10),
  (11, 'Đắk Lắk', 'dak-lak', 11),
  (12, 'Điện Biên', 'dien-bien', 12),
  (13, 'Đồng Nai', 'dong-nai', 13),
  (14, 'Đồng Tháp', 'dong-thap', 14),
  (15, 'Gia Lai', 'gia-lai', 15),
  (16, 'Hà Tĩnh', 'ha-tinh', 16),
  (17, 'Hưng Yên', 'hung-yen', 17),
  (18, 'Khánh Hòa', 'khanh-hoa', 18),
  (19, 'Lai Châu', 'lai-chau', 19),
  (20, 'Lâm Đồng', 'lam-dong', 20),
  (21, 'Lạng Sơn', 'lang-son', 21),
  (22, 'Lào Cai', 'lao-cai', 22),
  (23, 'Nghệ An', 'nghe-an', 23),
  (24, 'Ninh Bình', 'ninh-binh', 24),
  (25, 'Phú Thọ', 'phu-tho', 25),
  (26, 'Quảng Ngãi', 'quang-ngai', 26),
  (27, 'Quảng Ninh', 'quang-ninh', 27),
  (28, 'Quảng Trị', 'quang-tri', 28),
  (29, 'Sơn La', 'son-la', 29),
  (30, 'Tây Ninh', 'tay-ninh', 30),
  (31, 'Thái Nguyên', 'thai-nguyen', 31),
  (32, 'Thanh Hóa', 'thanh-hoa', 32),
  (33, 'Tuyên Quang', 'tuyen-quang', 33),
  (34, 'Vĩnh Long', 'vinh-long', 34);

-- Ngành nghề (cấp 1) và nhóm công việc (cấp 2)
INSERT INTO categories (id, parent_id, name, slug, description, icon, sort_order) VALUES
  (1, NULL, 'Công nghệ thông tin', 'cong-nghe-thong-tin', 'Lập trình, kiểm thử, dữ liệu, hạ tầng và bảo mật.', 'laptop', 1),
  (2, NULL, 'Kế toán – Tài chính', 'ke-toan-tai-chinh', 'Kế toán tổng hợp, kiểm toán, phân tích tài chính.', 'calculator', 2),
  (3, NULL, 'Kinh doanh – Bán hàng', 'kinh-doanh-ban-hang', 'Nhân viên kinh doanh, bán lẻ, chăm sóc khách hàng.', 'handshake', 3),
  (4, NULL, 'Marketing – Truyền thông', 'marketing-truyen-thong', 'Digital marketing, nội dung, thương hiệu, sự kiện.', 'megaphone', 4),
  (5, NULL, 'Xây dựng – Kỹ thuật', 'xay-dung-ky-thuat', 'Thiết kế, dự toán, giám sát thi công.', 'hard-hat', 5),
  (6, NULL, 'Giáo dục – Đào tạo', 'giao-duc-dao-tao', 'Giáo viên, trợ giảng, đào tạo nội bộ.', 'graduation-cap', 6),
  (7, NULL, 'Hành chính – Nhân sự', 'hanh-chinh-nhan-su', 'Tuyển dụng, C&B, hành chính văn phòng.', 'users', 7);

INSERT INTO categories (id, parent_id, name, slug, sort_order) VALUES
  (11, 1, 'Lập trình web', 'lap-trinh-web', 11),
  (12, 1, 'Lập trình di động', 'lap-trinh-di-dong', 12),
  (13, 1, 'Kiểm thử phần mềm', 'kiem-thu-phan-mem', 13),
  (14, 1, 'Dữ liệu – AI', 'du-lieu-ai', 14),
  (15, 1, 'Hạ tầng – DevOps', 'ha-tang-devops', 15),
  (16, 1, 'Thiết kế UI/UX', 'thiet-ke-ui-ux', 16),
  (21, 2, 'Kế toán', 'ke-toan', 21),
  (22, 2, 'Kiểm toán', 'kiem-toan', 22),
  (23, 2, 'Phân tích tài chính', 'phan-tich-tai-chinh', 23),
  (31, 3, 'Kinh doanh B2B', 'kinh-doanh-b2b', 31),
  (32, 3, 'Bán lẻ', 'ban-le', 32),
  (33, 3, 'Chăm sóc khách hàng', 'cham-soc-khach-hang', 33),
  (41, 4, 'Digital marketing', 'digital-marketing', 41),
  (42, 4, 'Sáng tạo nội dung', 'sang-tao-noi-dung', 42),
  (43, 4, 'Thương hiệu – Sự kiện', 'thuong-hieu-su-kien', 43),
  (51, 5, 'Thiết kế kiến trúc – kết cấu', 'thiet-ke-kien-truc-ket-cau', 51),
  (52, 5, 'Dự toán', 'du-toan', 52),
  (53, 5, 'Giám sát thi công', 'giam-sat-thi-cong', 53),
  (61, 6, 'Giảng dạy', 'giang-day', 61),
  (62, 6, 'Đào tạo nội bộ', 'dao-tao-noi-bo', 62),
  (71, 7, 'Tuyển dụng – Nhân sự', 'tuyen-dung-nhan-su', 71),
  (72, 7, 'Hành chính văn phòng', 'hanh-chinh-van-phong', 72);

-- Từ điển kỹ năng
INSERT INTO skills (id, name, slug, skill_type, category_id) VALUES
  (1, 'JavaScript', 'javascript', 'hard', 1),
  (2, 'TypeScript', 'typescript', 'hard', 1),
  (3, 'HTML/CSS', 'html-css', 'hard', 1),
  (4, 'React', 'react', 'hard', 1),
  (5, 'Vue.js', 'vue-js', 'hard', 1),
  (6, 'Angular', 'angular', 'hard', 1),
  (7, 'Next.js', 'next-js', 'hard', 1),
  (8, 'Redux', 'redux', 'hard', 1),
  (9, 'Tailwind CSS', 'tailwind-css', 'hard', 1),
  (10, 'SCSS', 'scss', 'hard', 1),
  (11, 'Node.js', 'node-js', 'hard', 1),
  (12, 'Express', 'express', 'hard', 1),
  (13, 'REST API', 'rest-api', 'hard', 1),
  (14, 'GraphQL', 'graphql', 'hard', 1),
  (15, 'Git', 'git', 'tool', 1),
  (16, 'Docker', 'docker', 'tool', 1),
  (17, 'Kubernetes', 'kubernetes', 'tool', 1),
  (18, 'Linux', 'linux', 'hard', 1),
  (19, 'MySQL', 'mysql', 'hard', 1),
  (20, 'PostgreSQL', 'postgresql', 'hard', 1),
  (21, 'MongoDB', 'mongodb', 'hard', 1),
  (22, 'Redis', 'redis', 'hard', 1),
  (23, 'SQL Server', 'sql-server', 'hard', 1),
  (24, 'Python', 'python', 'hard', 1),
  (25, 'Django', 'django', 'hard', 1),
  (26, 'FastAPI', 'fastapi', 'hard', 1),
  (27, 'Java', 'java', 'hard', 1),
  (28, 'Spring Boot', 'spring-boot', 'hard', 1),
  (29, 'PHP', 'php', 'hard', 1),
  (30, 'Laravel', 'laravel', 'hard', 1),
  (31, 'C#', 'csharp', 'hard', 1),
  (32, '.NET', 'net', 'hard', 1),
  (33, 'Go', 'go', 'hard', 1),
  (34, 'Flutter', 'flutter', 'hard', 1),
  (35, 'Dart', 'dart', 'hard', 1),
  (36, 'React Native', 'react-native', 'hard', 1),
  (37, 'Kotlin', 'kotlin', 'hard', 1),
  (38, 'Swift', 'swift', 'hard', 1),
  (39, 'Firebase', 'firebase', 'tool', 1),
  (40, 'AWS', 'aws', 'tool', 1),
  (41, 'Jest', 'jest', 'tool', 1),
  (42, 'Cypress', 'cypress', 'tool', 1),
  (43, 'Selenium', 'selenium', 'tool', 1),
  (44, 'Postman', 'postman', 'tool', 1),
  (45, 'Kiểm thử thủ công', 'kiem-thu-thu-cong', 'hard', 1),
  (46, 'Figma', 'figma', 'tool', 1),
  (47, 'Adobe Photoshop', 'adobe-photoshop', 'tool', NULL),
  (48, 'SQL', 'sql', 'hard', 1),
  (49, 'Machine Learning', 'machine-learning', 'hard', 1),
  (50, 'Pandas', 'pandas', 'tool', 1),
  (51, 'Power BI', 'power-bi', 'tool', 1),
  (52, 'Excel', 'excel', 'tool', NULL),
  (53, 'Tableau', 'tableau', 'tool', 1),
  (54, 'RxJS', 'rxjs', 'hard', 1),
  (55, 'GSAP', 'gsap', 'tool', 1),
  (56, 'Agile/Scrum', 'agile-scrum', 'hard', NULL),
  (57, 'Jira', 'jira', 'tool', NULL),
  (58, 'CI/CD', 'ci-cd', 'hard', 1),
  (59, 'Azure', 'azure', 'tool', 1),
  (60, 'Kế toán tổng hợp', 'ke-toan-tong-hop', 'hard', 2),
  (61, 'Báo cáo tài chính', 'bao-cao-tai-chinh', 'hard', 2),
  (62, 'Phần mềm MISA', 'phan-mem-misa', 'tool', 2),
  (63, 'Kê khai thuế', 'ke-khai-thue', 'hard', 2),
  (64, 'Kiểm toán', 'kiem-toan', 'hard', 2),
  (65, 'IFRS', 'ifrs', 'hard', 2),
  (66, 'SEO', 'seo', 'hard', 4),
  (67, 'Google Ads', 'google-ads', 'tool', 4),
  (68, 'Facebook Ads', 'facebook-ads', 'tool', 4),
  (69, 'Content Marketing', 'content-marketing', 'hard', 4),
  (70, 'Google Analytics', 'google-analytics', 'tool', 4),
  (71, 'Canva', 'canva', 'tool', 4),
  (72, 'Tư vấn bán hàng', 'tu-van-ban-hang', 'hard', 3),
  (73, 'Đàm phán', 'dam-phan', 'soft', 3),
  (74, 'CRM', 'crm', 'tool', 3),
  (75, 'Chăm sóc khách hàng', 'cham-soc-khach-hang', 'hard', 3),
  (76, 'AutoCAD', 'autocad', 'tool', 5),
  (77, 'Revit', 'revit', 'tool', 5),
  (78, 'Dự toán công trình', 'du-toan-cong-trinh', 'hard', 5),
  (79, 'Giám sát thi công', 'giam-sat-thi-cong', 'hard', 5),
  (80, 'SketchUp', 'sketchup', 'tool', 5),
  (81, 'Giảng dạy', 'giang-day', 'hard', 6),
  (82, 'Tiếng Anh', 'tieng-anh', 'language', NULL),
  (83, 'Tiếng Nhật', 'tieng-nhat', 'language', NULL),
  (84, 'Tiếng Trung', 'tieng-trung', 'language', NULL),
  (85, 'Giao tiếp', 'giao-tiep', 'soft', NULL),
  (86, 'Làm việc nhóm', 'lam-viec-nhom', 'soft', NULL),
  (87, 'Quản lý thời gian', 'quan-ly-thoi-gian', 'soft', NULL),
  (88, 'Giải quyết vấn đề', 'giai-quyet-van-de', 'soft', NULL),
  (89, 'Tuyển dụng', 'tuyen-dung', 'hard', 7),
  (90, 'C&B', 'c-b', 'hard', 7);

-- Từ đồng nghĩa (tên chuẩn viết thường cũng được so khớp, không cần thêm ở đây)
INSERT INTO skill_aliases (skill_id, alias) VALUES
  (1, 'js'),
  (1, 'ecmascript'),
  (1, 'es6'),
  (2, 'ts'),
  (3, 'html'),
  (3, 'css'),
  (3, 'html5'),
  (3, 'css3'),
  (4, 'reactjs'),
  (4, 'react.js'),
  (5, 'vue'),
  (5, 'vuejs'),
  (6, 'angularjs'),
  (7, 'nextjs'),
  (8, 'redux toolkit'),
  (9, 'tailwind'),
  (9, 'tailwindcss'),
  (10, 'sass'),
  (11, 'nodejs'),
  (11, 'node'),
  (12, 'expressjs'),
  (12, 'express.js'),
  (13, 'restful api'),
  (13, 'restful'),
  (13, 'rest'),
  (15, 'github'),
  (15, 'gitlab'),
  (17, 'k8s'),
  (18, 'ubuntu'),
  (18, 'centos'),
  (20, 'postgres'),
  (21, 'mongo'),
  (23, 'mssql'),
  (23, 'microsoft sql server'),
  (28, 'spring'),
  (28, 'springboot'),
  (31, 'c sharp'),
  (31, 'csharp'),
  (32, 'dotnet'),
  (32, 'asp.net'),
  (32, 'asp.net core'),
  (32, '.net core'),
  (33, 'golang'),
  (36, 'reactnative'),
  (40, 'amazon web services'),
  (45, 'manual test'),
  (45, 'manual testing'),
  (45, 'viết test case'),
  (45, 'test case'),
  (47, 'photoshop'),
  (48, 'truy vấn sql'),
  (49, 'học máy'),
  (49, 'ml'),
  (51, 'powerbi'),
  (52, 'ms excel'),
  (52, 'microsoft excel'),
  (56, 'agile'),
  (56, 'scrum'),
  (58, 'cicd'),
  (58, 'ci cd'),
  (58, 'github actions'),
  (58, 'gitlab ci'),
  (58, 'jenkins'),
  (59, 'microsoft azure'),
  (60, 'ke toan tong hop'),
  (61, 'bctc'),
  (61, 'lập báo cáo tài chính'),
  (62, 'misa'),
  (63, 'khai thuế'),
  (63, 'quyết toán thuế'),
  (63, 'báo cáo thuế'),
  (64, 'audit'),
  (64, 'kiểm toán nội bộ'),
  (66, 'tối ưu công cụ tìm kiếm'),
  (67, 'google adwords'),
  (67, 'adwords'),
  (68, 'meta ads'),
  (68, 'fb ads'),
  (68, 'quảng cáo facebook'),
  (69, 'viết content'),
  (69, 'copywriting'),
  (69, 'content'),
  (70, 'ga4'),
  (72, 'bán hàng'),
  (72, 'sales'),
  (73, 'negotiation'),
  (73, 'thương lượng'),
  (74, 'salesforce'),
  (74, 'hubspot'),
  (75, 'cskh'),
  (75, 'customer service'),
  (76, 'cad'),
  (76, 'autocad 2d'),
  (78, 'lập dự toán'),
  (78, 'bóc tách khối lượng'),
  (78, 'dự toán'),
  (79, 'giám sát công trình'),
  (81, 'đứng lớp'),
  (81, 'teaching'),
  (82, 'english'),
  (82, 'ielts'),
  (82, 'toeic'),
  (83, 'japanese'),
  (83, 'jlpt'),
  (84, 'chinese'),
  (84, 'hsk'),
  (85, 'kỹ năng giao tiếp'),
  (85, 'communication'),
  (86, 'teamwork'),
  (87, 'time management'),
  (88, 'problem solving'),
  (89, 'recruitment'),
  (89, 'headhunt'),
  (89, 'talent acquisition'),
  (90, 'tính lương'),
  (90, 'lương thưởng'),
  (90, 'compensation & benefits');

-- Cấu hình
INSERT INTO app_settings (setting_key, setting_value, description) VALUES
  ('match_weights', '{"coverage": 0.4, "tfidf": 0.2, "semantic": 0.3, "criteria": 0.1}', 'Trọng số điểm phù hợp tổng hợp'),
  ('skill_weights', '{"required": 2, "preferred": 1}', 'Trọng số kỹ năng bắt buộc/ưu tiên trong Coverage'),
  ('embedding_model', '"sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"', 'Model Sentence-BERT cho thuật toán 3'),
  ('top_k', '10', 'Số việc gợi ý cho ứng viên'),
  ('cv_rules', '{"required_sections": ["personal", "objective", "experiences", "educations", "skills"], "min_experience_words": 20, "cliches": ["chăm chỉ", "ham học hỏi", "nhiệt tình", "năng động", "chịu được áp lực", "trung thực", "cầu tiến", "có trách nhiệm"]}', 'Quy tắc đánh giá CV (chức năng 3)');

-- Tài khoản: 1 admin, 14 nhà tuyển dụng (1 chờ duyệt), 3 ứng viên
INSERT INTO users (id, email, password_hash, full_name, phone, role, status, created_at) VALUES
  (1, 'admin@khopviec.vn', '$2b$12$BTIFI8G3aFFVDwc9zoPLt.32s/iNq6O2OEC/CqzC//bnifmuzPayi', 'Quản trị viên', NULL, 'admin', 'active', NOW() - INTERVAL 2880 HOUR),
  (2, 'tuyendung01@khopviec.vn', '$2b$12$BTIFI8G3aFFVDwc9zoPLt.32s/iNq6O2OEC/CqzC//bnifmuzPayi', 'Phạm Thu Hà', '0901111001', 'employer', 'active', NOW() - INTERVAL 2040 HOUR),
  (3, 'tuyendung02@khopviec.vn', '$2b$12$BTIFI8G3aFFVDwc9zoPLt.32s/iNq6O2OEC/CqzC//bnifmuzPayi', 'Vũ Đức Long', '0902111002', 'employer', 'active', NOW() - INTERVAL 1920 HOUR),
  (4, 'tuyendung03@khopviec.vn', '$2b$12$BTIFI8G3aFFVDwc9zoPLt.32s/iNq6O2OEC/CqzC//bnifmuzPayi', 'Đặng Mỹ Linh', '0903111003', 'employer', 'active', NOW() - INTERVAL 1800 HOUR),
  (5, 'tuyendung04@khopviec.vn', '$2b$12$BTIFI8G3aFFVDwc9zoPLt.32s/iNq6O2OEC/CqzC//bnifmuzPayi', 'Bùi Quang Huy', '0904111004', 'employer', 'active', NOW() - INTERVAL 1680 HOUR),
  (6, 'tuyendung05@khopviec.vn', '$2b$12$BTIFI8G3aFFVDwc9zoPLt.32s/iNq6O2OEC/CqzC//bnifmuzPayi', 'Hồ Thị Lan', '0905111005', 'employer', 'active', NOW() - INTERVAL 1560 HOUR),
  (7, 'tuyendung06@khopviec.vn', '$2b$12$BTIFI8G3aFFVDwc9zoPLt.32s/iNq6O2OEC/CqzC//bnifmuzPayi', 'Ngô Văn Tài', '0906111006', 'employer', 'active', NOW() - INTERVAL 1440 HOUR),
  (8, 'tuyendung07@khopviec.vn', '$2b$12$BTIFI8G3aFFVDwc9zoPLt.32s/iNq6O2OEC/CqzC//bnifmuzPayi', 'Đỗ Thanh Tâm', '0907111007', 'employer', 'active', NOW() - INTERVAL 1320 HOUR),
  (9, 'tuyendung08@khopviec.vn', '$2b$12$BTIFI8G3aFFVDwc9zoPLt.32s/iNq6O2OEC/CqzC//bnifmuzPayi', 'Trịnh Minh Quân', '0908111008', 'employer', 'active', NOW() - INTERVAL 1200 HOUR),
  (10, 'tuyendung09@khopviec.vn', '$2b$12$BTIFI8G3aFFVDwc9zoPLt.32s/iNq6O2OEC/CqzC//bnifmuzPayi', 'Lý Ngọc Anh', '0909111009', 'employer', 'active', NOW() - INTERVAL 1080 HOUR),
  (11, 'tuyendung10@khopviec.vn', '$2b$12$BTIFI8G3aFFVDwc9zoPLt.32s/iNq6O2OEC/CqzC//bnifmuzPayi', 'Mai Xuân Bách', '0910111010', 'employer', 'active', NOW() - INTERVAL 960 HOUR),
  (12, 'tuyendung11@khopviec.vn', '$2b$12$BTIFI8G3aFFVDwc9zoPLt.32s/iNq6O2OEC/CqzC//bnifmuzPayi', 'Phan Thị Hồng', '0911111011', 'employer', 'active', NOW() - INTERVAL 840 HOUR),
  (13, 'tuyendung12@khopviec.vn', '$2b$12$BTIFI8G3aFFVDwc9zoPLt.32s/iNq6O2OEC/CqzC//bnifmuzPayi', 'Tạ Văn Phú', '0912111012', 'employer', 'active', NOW() - INTERVAL 720 HOUR),
  (14, 'tuyendung13@khopviec.vn', '$2b$12$BTIFI8G3aFFVDwc9zoPLt.32s/iNq6O2OEC/CqzC//bnifmuzPayi', 'Dương Kim Oanh', '0913111013', 'employer', 'active', NOW() - INTERVAL 600 HOUR),
  (15, 'tuyendung14@khopviec.vn', '$2b$12$BTIFI8G3aFFVDwc9zoPLt.32s/iNq6O2OEC/CqzC//bnifmuzPayi', 'Huỳnh Gia Bảo', '0914111014', 'employer', 'pending', NOW() - INTERVAL 20 HOUR),
  (16, 'an.nguyen@khopviec.vn', '$2b$12$BTIFI8G3aFFVDwc9zoPLt.32s/iNq6O2OEC/CqzC//bnifmuzPayi', 'Nguyễn Văn An', '0981234567', 'candidate', 'active', NOW() - INTERVAL 576 HOUR),
  (17, 'binh.tran@khopviec.vn', '$2b$12$BTIFI8G3aFFVDwc9zoPLt.32s/iNq6O2OEC/CqzC//bnifmuzPayi', 'Trần Thị Bình', '0912345678', 'candidate', 'active', NOW() - INTERVAL 552 HOUR),
  (18, 'chau.le@khopviec.vn', '$2b$12$BTIFI8G3aFFVDwc9zoPLt.32s/iNq6O2OEC/CqzC//bnifmuzPayi', 'Lê Minh Châu', '0934567890', 'candidate', 'active', NOW() - INTERVAL 528 HOUR);

-- Hồ sơ ứng viên
INSERT INTO candidate_profiles (user_id, headline, date_of_birth, gender, address, city_id, desired_category_id, desired_salary_min, desired_salary_max, years_of_experience, education_level, summary) VALUES
  (16, 'Frontend Developer (ReactJS)', '2002-05-14', 'male', 'Cầu Giấy, Hà Nội', 1, 11, 15, 22, 1.5, 'university', 'Lập trình viên frontend 1,5 năm kinh nghiệm với React và TypeScript, đã làm hệ thống quản lý bán hàng cho chuỗi 30 cửa hàng.'),
  (17, 'Kế toán tổng hợp', '1998-11-02', 'female', 'Quận 7, TP. Hồ Chí Minh', 2, 21, 12, 16, 3, 'university', 'Kế toán 3 năm kinh nghiệm tại công ty thương mại, thành thạo MISA và lập báo cáo tài chính.'),
  (18, 'Nhân viên Digital Marketing', '2000-08-20', 'female', 'Hải Châu, Đà Nẵng', 4, 41, 10, 14, 2, 'university', 'Chạy quảng cáo Facebook và Google cho khách sạn, khu nghỉ dưỡng.');

-- Công ty
INSERT INTO companies (id, owner_id, name, slug, tax_code, email, phone, address, city_id, company_size, description, is_verified) VALUES
  (1, 2, 'Công ty CP Công nghệ Sao Mai', 'cong-ty-cp-cong-nghe-sao-mai', '0109123401', 'lienhe01@khopviec.vn', '02013456001', 'Số 7 đường số 1, Hà Nội', 1, '51-200', 'Phát triển phần mềm quản lý bán hàng và kho cho chuỗi bán lẻ.', TRUE),
  (2, 3, 'Hạ Long Software', 'ha-long-software', '0109123402', 'lienhe02@khopviec.vn', '02023456002', 'Số 14 đường số 2, Hà Nội', 1, '201-500', 'Gia công phần mềm cho khách hàng Nhật Bản và Singapore.', TRUE),
  (3, 4, 'An Phát Digital', 'an-phat-digital', '0312123403', 'lienhe03@khopviec.vn', '02033456003', 'Số 21 đường số 3, TP. Hồ Chí Minh', 2, '51-200', 'Agency thiết kế website và marketing số cho doanh nghiệp vừa.', TRUE),
  (4, 5, 'Minh Long Solutions', 'minh-long-solutions', '0109123404', 'lienhe04@khopviec.vn', '02043456004', 'Số 28 đường số 4, Hà Nội', 1, '11-50', 'Giải pháp chuyển đổi số cho trường học và bệnh viện.', TRUE),
  (5, 6, 'Lam Sơn Media', 'lam-son-media', '0401123405', 'lienhe05@khopviec.vn', '02053456005', 'Số 35 đường số 5, Đà Nẵng', 4, '11-50', 'Truyền thông và quảng cáo trực tuyến cho ngành du lịch, khách sạn.', TRUE),
  (6, 7, 'Bình Minh Apps', 'binh-minh-apps', '0312123406', 'lienhe06@khopviec.vn', '02063456006', 'Số 42 đường số 6, TP. Hồ Chí Minh', 2, '11-50', 'Phát triển ứng dụng di động thương mại điện tử và giao đồ ăn.', TRUE),
  (7, 8, 'Phương Nam QA', 'phuong-nam-qa', '0109123407', 'lienhe07@khopviec.vn', '02073456007', 'Số 49 đường số 7, Hà Nội', 1, '51-200', 'Dịch vụ kiểm thử phần mềm độc lập.', TRUE),
  (8, 9, 'Đông Á Fintech', 'dong-a-fintech', '0109123408', 'lienhe08@khopviec.vn', '02083456008', 'Số 56 đường số 8, Hà Nội', 1, '201-500', 'Nền tảng thanh toán và cho vay tiêu dùng.', TRUE),
  (9, 10, 'Hoàng Gia Web', 'hoang-gia-web', '0109123409', 'lienhe09@khopviec.vn', '02093456009', 'Số 63 đường số 9, Hà Nội', 1, '1-10', 'Thiết kế website trọn gói cho cửa hàng nhỏ.', TRUE),
  (10, 11, 'Tân Việt Soft', 'tan-viet-soft', '0109123410', 'lienhe10@khopviec.vn', '02103456010', 'Số 70 đường số 10, Hà Nội', 1, '11-50', 'Sản phẩm SaaS quản lý nhân sự cho doanh nghiệp nhỏ.', TRUE),
  (11, 12, 'Công ty TNHH Thương mại Hòa Bình', 'cong-ty-tnhh-thuong-mai-hoa-binh', '0312123411', 'lienhe11@khopviec.vn', '02113456011', 'Số 77 đường số 11, TP. Hồ Chí Minh', 2, '201-500', 'Phân phối thiết bị gia dụng, hệ thống 40 cửa hàng.', TRUE),
  (12, 13, 'Công ty CP Xây dựng Phú Thịnh', 'cong-ty-cp-xay-dung-phu-thinh', '0109123412', 'lienhe12@khopviec.vn', '02123456012', 'Số 84 đường số 12, Hà Nội', 1, '201-500', 'Thi công nhà ở, trường học và công trình công cộng.', TRUE),
  (13, 14, 'Trung tâm Ngoại ngữ Ánh Dương', 'trung-tam-ngoai-ngu-anh-duong', '0312123413', 'lienhe13@khopviec.vn', '02133456013', 'Số 91 đường số 13, TP. Hồ Chí Minh', 2, '11-50', 'Dạy tiếng Anh cho thiếu nhi và luyện thi IELTS.', TRUE),
  (14, 15, 'Công ty TNHH Giải pháp Xanh', 'cong-ty-tnhh-giai-phap-xanh', '1801123414', 'lienhe14@khopviec.vn', '02143456014', 'Số 98 đường số 14, Cần Thơ', 5, '1-10', 'Tư vấn giải pháp năng lượng mặt trời cho hộ gia đình.', FALSE);

-- Tin tuyển dụng (approved: 27, pending: 2, closed: 1, rejected: 1, draft: 1)
INSERT INTO jobs (id, company_id, created_by, category_id, title, slug, description, requirements, benefits, city_id, employment_type, work_mode, experience_min_years, experience_max_years, education_level, salary_min, salary_max, vacancies, deadline, status, rejection_reason, reviewed_by, reviewed_at, published_at, closed_at, view_count, created_at) VALUES
  (1, 1, 2, 11, 'Frontend Developer (ReactJS)', 'frontend-developer-reactjs-1', '- Phát triển giao diện cho hệ thống quản lý bán hàng và kho
- Chuyển thiết kế Figma thành component React tái sử dụng
- Kết nối REST API với đội backend, tối ưu tốc độ tải trang', '- Ít nhất 1 năm làm React, JavaScript, TypeScript
- Nắm chắc HTML/CSS, responsive
- Đã làm việc với REST API
- Biết Redux hoặc viết unit test với Jest là lợi thế', '- Lương tháng 13 và thưởng dự án
- Bảo hiểm sức khỏe cho nhân viên và người thân
- 15 ngày phép/năm, làm việc từ thứ 2 đến thứ 6
- Ngân sách học khóa học và thi chứng chỉ', 1, 'full_time', 'hybrid', 1, 2, 'university', 15, 22, 2, CURDATE() + INTERVAL 21 DAY, 'approved', NULL, 1, NOW() - INTERVAL 2 HOUR, NOW() - INTERVAL 2 HOUR, NULL, 412, NOW() - INTERVAL 8 HOUR),
  (2, 2, 3, 11, 'ReactJS Developer', 'reactjs-developer-2', '- Phát triển ứng dụng web cho khách hàng Nhật Bản
- Tham gia review code và viết tài liệu kỹ thuật
- Phối hợp với đội BrSE để làm rõ yêu cầu', '- 2 năm kinh nghiệm React, Redux, TypeScript
- Sử dụng thành thạo Git
- Biết Next.js, Docker là lợi thế', '- Lương tháng 13 và thưởng dự án
- Bảo hiểm sức khỏe cho nhân viên và người thân
- 15 ngày phép/năm, làm việc từ thứ 2 đến thứ 6
- Ngân sách học khóa học và thi chứng chỉ', 1, 'full_time', 'onsite', 2, 4, 'university', 18, 25, 3, CURDATE() + INTERVAL 9 DAY, 'approved', NULL, 1, NOW() - INTERVAL 20 HOUR, NOW() - INTERVAL 20 HOUR, NULL, 388, NOW() - INTERVAL 26 HOUR),
  (3, 10, 11, 11, 'Thực tập sinh Frontend', 'thuc-tap-sinh-frontend-3', '- Cắt giao diện từ thiết kế cho sản phẩm quản lý nhân sự
- Sửa lỗi giao diện dưới sự hướng dẫn của mentor
- Học quy trình làm việc theo Scrum', '- Sinh viên năm cuối ngành CNTT hoặc liên quan
- Biết HTML/CSS, JavaScript cơ bản, dùng được Git
- Đã học React là lợi thế', '- Lương tháng 13 và thưởng dự án
- Bảo hiểm sức khỏe cho nhân viên và người thân
- 15 ngày phép/năm, làm việc từ thứ 2 đến thứ 6
- Ngân sách học khóa học và thi chứng chỉ', 1, 'internship', 'onsite', 0, NULL, 'college', 5, 7, 4, CURDATE() + INTERVAL 16 DAY, 'approved', NULL, 1, NOW() - INTERVAL 30 HOUR, NOW() - INTERVAL 30 HOUR, NULL, 265, NOW() - INTERVAL 36 HOUR),
  (4, 3, 4, 11, 'Front-end Engineer (Vue/React)', 'front-end-engineer-vue-react-4', '- Xây dựng website giới thiệu và trang bán hàng cho khách hàng của agency
- Tối ưu điểm Core Web Vitals
- Làm việc trực tiếp với designer', '- 2 năm kinh nghiệm JavaScript, HTML/CSS
- Thành thạo Vue.js
- Biết thêm React, Tailwind CSS là lợi thế', '- Lương tháng 13 và thưởng dự án
- Bảo hiểm sức khỏe cho nhân viên và người thân
- 15 ngày phép/năm, làm việc từ thứ 2 đến thứ 6
- Ngân sách học khóa học và thi chứng chỉ', 2, 'full_time', 'hybrid', 2, 3, 'university', 20, 28, 1, CURDATE() + INTERVAL 31 DAY, 'approved', NULL, 1, NOW() - INTERVAL 26 HOUR, NOW() - INTERVAL 26 HOUR, NULL, 190, NOW() - INTERVAL 32 HOUR),
  (5, 4, 5, 11, 'Web Developer (Fullstack JS)', 'web-developer-fullstack-js-5', '- Phát triển cổng thông tin cho trường học: giao diện React và API Node.js
- Thiết kế cơ sở dữ liệu MySQL
- Triển khai lên máy chủ của khách hàng', '- 1 năm kinh nghiệm JavaScript, Node.js, React
- Viết được truy vấn MySQL
- Biết Docker là lợi thế', '- Lương tháng 13 và thưởng dự án
- Bảo hiểm sức khỏe cho nhân viên và người thân
- 15 ngày phép/năm, làm việc từ thứ 2 đến thứ 6
- Ngân sách học khóa học và thi chứng chỉ', 1, 'full_time', 'onsite', 1, 3, 'university', 15, 20, 2, CURDATE() + INTERVAL 4 DAY, 'approved', NULL, 1, NOW() - INTERVAL 50 HOUR, NOW() - INTERVAL 50 HOUR, NULL, 301, NOW() - INTERVAL 56 HOUR),
  (6, 5, 6, 11, 'UI Developer', 'ui-developer-6', '- Dựng landing page cho các chiến dịch quảng cáo du lịch
- Làm hiệu ứng chuyển động cho trang giới thiệu khách sạn
- Đảm bảo hiển thị đúng trên điện thoại', '- Thành thạo HTML/CSS, JavaScript
- Đọc được thiết kế Figma
- Biết SCSS, GSAP là lợi thế', '- Lương tháng 13 và thưởng dự án
- Bảo hiểm sức khỏe cho nhân viên và người thân
- 15 ngày phép/năm, làm việc từ thứ 2 đến thứ 6
- Ngân sách học khóa học và thi chứng chỉ', 4, 'full_time', 'onsite', 1, 2, 'college', 12, 18, 1, CURDATE() + INTERVAL 36 DAY, 'approved', NULL, 1, NOW() - INTERVAL 60 HOUR, NOW() - INTERVAL 60 HOUR, NULL, 122, NOW() - INTERVAL 66 HOUR),
  (7, 6, 7, 12, 'Mobile Developer (React Native)', 'mobile-developer-react-native-7', '- Phát triển ứng dụng giao đồ ăn trên iOS và Android
- Tích hợp thanh toán và thông báo đẩy
- Theo dõi lỗi và hiệu năng sau khi phát hành', '- 2 năm kinh nghiệm React Native, JavaScript, TypeScript
- Đã phát hành ít nhất 1 ứng dụng lên store
- Biết Redux, Firebase là lợi thế', '- Lương tháng 13 và thưởng dự án
- Bảo hiểm sức khỏe cho nhân viên và người thân
- 15 ngày phép/năm, làm việc từ thứ 2 đến thứ 6
- Ngân sách học khóa học và thi chứng chỉ', 2, 'full_time', 'hybrid', 2, 4, 'university', 20, 30, 2, CURDATE() + INTERVAL 26 DAY, 'approved', NULL, 1, NOW() - INTERVAL 70 HOUR, NOW() - INTERVAL 70 HOUR, NULL, 276, NOW() - INTERVAL 76 HOUR),
  (8, 7, 8, 13, 'Kỹ sư kiểm thử tự động', 'ky-su-kiem-thu-tu-dong-8', '- Viết kịch bản kiểm thử tự động cho web bằng Cypress
- Viết unit test với Jest cùng đội phát triển
- Báo cáo lỗi và theo dõi đến khi sửa xong', '- 1 năm kinh nghiệm kiểm thử tự động
- Biết JavaScript, Cypress, Jest, Git
- Biết TypeScript là lợi thế', '- Lương tháng 13 và thưởng dự án
- Bảo hiểm sức khỏe cho nhân viên và người thân
- 15 ngày phép/năm, làm việc từ thứ 2 đến thứ 6
- Ngân sách học khóa học và thi chứng chỉ', 1, 'full_time', 'onsite', 1, 2, 'university', 14, 20, 2, CURDATE() + INTERVAL 19 DAY, 'approved', NULL, 1, NOW() - INTERVAL 34 HOUR, NOW() - INTERVAL 34 HOUR, NULL, 158, NOW() - INTERVAL 40 HOUR),
  (9, 8, 9, 11, 'Frontend Developer (Angular)', 'frontend-developer-angular-9', '- Phát triển trang quản trị khoản vay cho nhân viên thẩm định
- Làm việc với dữ liệu thời gian thực bằng RxJS
- Viết tài liệu component nội bộ', '- 2 năm kinh nghiệm Angular, TypeScript, RxJS
- Hiểu HTML/CSS và khả năng truy cập
- Ưu tiên từng làm sản phẩm tài chính', '- Lương tháng 13 và thưởng dự án
- Bảo hiểm sức khỏe cho nhân viên và người thân
- 15 ngày phép/năm, làm việc từ thứ 2 đến thứ 6
- Ngân sách học khóa học và thi chứng chỉ', 1, 'full_time', 'onsite', 2, 4, 'university', 20, 30, 1, CURDATE() + INTERVAL 23 DAY, 'approved', NULL, 1, NOW() - INTERVAL 40 HOUR, NOW() - INTERVAL 40 HOUR, NULL, 203, NOW() - INTERVAL 46 HOUR),
  (10, 9, 10, 11, 'Web Developer (PHP/Laravel)', 'web-developer-php-laravel-10', '- Làm website bán hàng cho cửa hàng nhỏ bằng Laravel
- Tùy chỉnh giao diện theo yêu cầu khách
- Bảo trì các website đang chạy', '- 1 năm kinh nghiệm PHP, Laravel, MySQL
- Biết JavaScript
- Biết Vue.js là lợi thế', '- Lương tháng 13 và thưởng dự án
- Bảo hiểm sức khỏe cho nhân viên và người thân
- 15 ngày phép/năm, làm việc từ thứ 2 đến thứ 6
- Ngân sách học khóa học và thi chứng chỉ', 1, 'full_time', 'onsite', 1, 2, 'college', 12, 18, 1, CURDATE() + INTERVAL 32 DAY, 'approved', NULL, 1, NOW() - INTERVAL 80 HOUR, NOW() - INTERVAL 80 HOUR, NULL, 97, NOW() - INTERVAL 86 HOUR),
  (11, 1, 2, 11, 'Backend Developer (Python/FastAPI)', 'backend-developer-python-fastapi-11', '- Xây dựng API cho hệ thống quản lý kho bằng FastAPI
- Thiết kế cơ sở dữ liệu PostgreSQL, tối ưu truy vấn
- Đóng gói dịch vụ bằng Docker', '- 2 năm kinh nghiệm Python, FastAPI hoặc Django
- Thành thạo PostgreSQL, REST API, Docker
- Biết Redis, AWS là lợi thế', '- Lương tháng 13 và thưởng dự án
- Bảo hiểm sức khỏe cho nhân viên và người thân
- 15 ngày phép/năm, làm việc từ thứ 2 đến thứ 6
- Ngân sách học khóa học và thi chứng chỉ', 1, 'full_time', 'hybrid', 2, 4, 'university', 22, 32, 2, CURDATE() + INTERVAL 28 DAY, 'approved', NULL, 1, NOW() - INTERVAL 10 HOUR, NOW() - INTERVAL 10 HOUR, NULL, 344, NOW() - INTERVAL 16 HOUR),
  (12, 8, 9, 11, 'Java Developer (Spring Boot)', 'java-developer-spring-boot-12', '- Phát triển dịch vụ thanh toán bằng Java Spring Boot
- Đảm bảo hệ thống xử lý 2.000 giao dịch/giây
- Tham gia thiết kế kiến trúc microservice', '- 3 năm kinh nghiệm Java, Spring Boot
- Thành thạo MySQL, REST API
- Biết Kubernetes, làm việc theo Agile/Scrum là lợi thế', '- Lương tháng 13 và thưởng dự án
- Bảo hiểm sức khỏe cho nhân viên và người thân
- 15 ngày phép/năm, làm việc từ thứ 2 đến thứ 6
- Ngân sách học khóa học và thi chứng chỉ', 1, 'full_time', 'onsite', 3, 5, 'university', 25, 40, 2, CURDATE() + INTERVAL 25 DAY, 'approved', NULL, 1, NOW() - INTERVAL 44 HOUR, NOW() - INTERVAL 44 HOUR, NULL, 287, NOW() - INTERVAL 50 HOUR),
  (13, 6, 7, 12, 'Flutter Developer', 'flutter-developer-13', '- Phát triển ứng dụng thương mại điện tử bằng Flutter
- Kết nối REST API, xử lý giỏ hàng ngoại tuyến
- Viết test cho các màn hình chính', '- 1 năm kinh nghiệm Flutter, Dart
- Đã làm việc với REST API
- Biết Firebase, Git là lợi thế', '- Lương tháng 13 và thưởng dự án
- Bảo hiểm sức khỏe cho nhân viên và người thân
- 15 ngày phép/năm, làm việc từ thứ 2 đến thứ 6
- Ngân sách học khóa học và thi chứng chỉ', 2, 'full_time', 'hybrid', 1, 3, 'university', 15, 25, 1, CURDATE() + INTERVAL 20 DAY, 'approved', NULL, 1, NOW() - INTERVAL 52 HOUR, NOW() - INTERVAL 52 HOUR, NULL, 176, NOW() - INTERVAL 58 HOUR),
  (14, 4, 5, 14, 'Data Analyst', 'data-analyst-14', '- Phân tích dữ liệu khám chữa bệnh cho các bệnh viện đối tác
- Xây dựng dashboard Power BI cho ban giám đốc
- Làm sạch và chuẩn hóa dữ liệu nguồn', '- Thành thạo SQL, Python, Excel
- Đã làm dashboard bằng Power BI
- Biết Pandas, Tableau là lợi thế', '- Lương tháng 13 và thưởng dự án
- Bảo hiểm sức khỏe cho nhân viên và người thân
- 15 ngày phép/năm, làm việc từ thứ 2 đến thứ 6
- Ngân sách học khóa học và thi chứng chỉ', 1, 'full_time', 'onsite', 1, 3, 'university', 15, 22, 1, CURDATE() + INTERVAL 22 DAY, 'approved', NULL, 1, NOW() - INTERVAL 36 HOUR, NOW() - INTERVAL 36 HOUR, NULL, 230, NOW() - INTERVAL 42 HOUR),
  (15, 2, 3, 15, 'DevOps Engineer', 'devops-engineer-15', '- Vận hành hạ tầng Kubernetes trên AWS cho 20 dự án
- Xây dựng pipeline CI/CD
- Giám sát và cảnh báo sự cố 24/7 theo ca', '- 3 năm kinh nghiệm Docker, Kubernetes, Linux
- Đã dựng CI/CD và làm việc với AWS
- Biết Python hoặc Go để viết script là lợi thế', '- Lương tháng 13 và thưởng dự án
- Bảo hiểm sức khỏe cho nhân viên và người thân
- 15 ngày phép/năm, làm việc từ thứ 2 đến thứ 6
- Ngân sách học khóa học và thi chứng chỉ', 1, 'full_time', 'hybrid', 3, 5, 'university', 30, 45, 1, CURDATE() + INTERVAL 30 DAY, 'approved', NULL, 1, NOW() - INTERVAL 64 HOUR, NOW() - INTERVAL 64 HOUR, NULL, 199, NOW() - INTERVAL 70 HOUR),
  (16, 7, 8, 13, 'Tester (Manual)', 'tester-manual-16', '- Viết test case và kiểm thử ứng dụng web, di động
- Ghi nhận lỗi trên Jira
- Kiểm tra dữ liệu bằng truy vấn SQL', '- Có kiến thức kiểm thử thủ công, biết viết test case
- Biết SQL cơ bản, dùng Jira
- Biết Postman, Selenium là lợi thế', '- Lương tháng 13 và thưởng dự án
- Bảo hiểm sức khỏe cho nhân viên và người thân
- 15 ngày phép/năm, làm việc từ thứ 2 đến thứ 6
- Ngân sách học khóa học và thi chứng chỉ', 1, 'full_time', 'onsite', 0, 1, 'college', 9, 13, 3, CURDATE() + INTERVAL 14 DAY, 'approved', NULL, 1, NOW() - INTERVAL 28 HOUR, NOW() - INTERVAL 28 HOUR, NULL, 141, NOW() - INTERVAL 34 HOUR),
  (17, 5, 6, 16, 'UI/UX Designer', 'ui-ux-designer-17', '- Thiết kế giao diện website và ứng dụng đặt phòng
- Làm wireframe, prototype trên Figma
- Phỏng vấn người dùng để cải thiện trải nghiệm', '- 2 năm kinh nghiệm thiết kế UI/UX
- Thành thạo Figma, Adobe Photoshop
- Hiểu HTML/CSS, quen quy trình Agile là lợi thế', '- Lương tháng 13 và thưởng dự án
- Bảo hiểm sức khỏe cho nhân viên và người thân
- 15 ngày phép/năm, làm việc từ thứ 2 đến thứ 6
- Ngân sách học khóa học và thi chứng chỉ', 4, 'full_time', 'onsite', 2, 3, 'university', 15, 22, 1, CURDATE() + INTERVAL 27 DAY, 'approved', NULL, 1, NOW() - INTERVAL 58 HOUR, NOW() - INTERVAL 58 HOUR, NULL, 133, NOW() - INTERVAL 64 HOUR),
  (18, 11, 12, 21, 'Kế toán tổng hợp', 'ke-toan-tong-hop-18', '- Hạch toán, kiểm tra chứng từ của 40 cửa hàng
- Lập báo cáo tài chính tháng, quý, năm
- Kê khai và quyết toán thuế', '- Tốt nghiệp đại học ngành kế toán, 2 năm kinh nghiệm kế toán tổng hợp
- Thành thạo phần mềm MISA, Excel
- Đọc hiểu tiếng Anh chuyên ngành là lợi thế', '- Lương tháng 13, thưởng theo kết quả kinh doanh
- Đóng bảo hiểm đầy đủ theo lương thực nhận
- Du lịch công ty hằng năm
- Làm việc giờ hành chính, nghỉ chiều thứ 7', 2, 'full_time', 'onsite', 2, 4, 'university', 12, 16, 1, CURDATE() + INTERVAL 29 DAY, 'approved', NULL, 1, NOW() - INTERVAL 5 HOUR, NOW() - INTERVAL 5 HOUR, NULL, 356, NOW() - INTERVAL 11 HOUR),
  (19, 11, 12, 22, 'Chuyên viên kiểm toán nội bộ', 'chuyen-vien-kiem-toan-noi-bo-19', '- Kiểm tra quy trình nhập hàng, tồn kho và doanh thu tại cửa hàng
- Đề xuất cải tiến kiểm soát nội bộ
- Báo cáo trực tiếp ban giám đốc', '- 2 năm kinh nghiệm kiểm toán
- Hiểu báo cáo tài chính, thành thạo Excel
- Biết IFRS, tiếng Anh tốt là lợi thế', '- Lương tháng 13, thưởng theo kết quả kinh doanh
- Đóng bảo hiểm đầy đủ theo lương thực nhận
- Du lịch công ty hằng năm
- Làm việc giờ hành chính, nghỉ chiều thứ 7', 2, 'full_time', 'onsite', 2, 4, 'university', 15, 22, 1, CURDATE() + INTERVAL 24 DAY, 'approved', NULL, 1, NOW() - INTERVAL 46 HOUR, NOW() - INTERVAL 46 HOUR, NULL, 118, NOW() - INTERVAL 52 HOUR),
  (20, 5, 6, 41, 'Chuyên viên Digital Marketing', 'chuyen-vien-digital-marketing-20', '- Chạy quảng cáo Facebook, Google cho chuỗi khách sạn
- Theo dõi chi phí trên mỗi lượt đặt phòng bằng Google Analytics
- Phối hợp viết nội dung quảng cáo', '- 1 năm kinh nghiệm Facebook Ads, Google Ads
- Biết đọc số liệu Google Analytics
- Biết viết content, dùng Canva là lợi thế', '- Lương tháng 13, thưởng theo kết quả kinh doanh
- Đóng bảo hiểm đầy đủ theo lương thực nhận
- Du lịch công ty hằng năm
- Làm việc giờ hành chính, nghỉ chiều thứ 7', 4, 'full_time', 'onsite', 1, 3, 'university', 10, 15, 1, CURDATE() + INTERVAL 26 DAY, 'approved', NULL, 1, NOW() - INTERVAL 8 HOUR, NOW() - INTERVAL 8 HOUR, NULL, 240, NOW() - INTERVAL 14 HOUR),
  (21, 3, 4, 42, 'Content Marketing Executive', 'content-marketing-executive-21', '- Viết bài blog, kịch bản video cho khách hàng của agency
- Tối ưu SEO cho bài viết
- Lên lịch đăng bài hằng tháng', '- 1 năm kinh nghiệm content marketing
- Hiểu SEO cơ bản
- Biết Canva, Google Analytics là lợi thế', '- Lương tháng 13, thưởng theo kết quả kinh doanh
- Đóng bảo hiểm đầy đủ theo lương thực nhận
- Du lịch công ty hằng năm
- Làm việc giờ hành chính, nghỉ chiều thứ 7', 2, 'full_time', 'hybrid', 1, 2, 'university', 10, 14, 2, CURDATE() + INTERVAL 18 DAY, 'approved', NULL, 1, NOW() - INTERVAL 22 HOUR, NOW() - INTERVAL 22 HOUR, NULL, 167, NOW() - INTERVAL 28 HOUR),
  (22, 2, 3, 31, 'Nhân viên kinh doanh phần mềm', 'nhan-vien-kinh-doanh-phan-mem-22', '- Tư vấn giải pháp quản lý cho doanh nghiệp vừa và nhỏ
- Gặp khách hàng, đàm phán và chốt hợp đồng
- Chăm sóc khách hàng sau bán', '- Kỹ năng tư vấn bán hàng, đàm phán và giao tiếp tốt
- Không yêu cầu kinh nghiệm, được đào tạo sản phẩm
- Biết dùng CRM, tiếng Anh giao tiếp là lợi thế', '- Lương tháng 13, thưởng theo kết quả kinh doanh
- Đóng bảo hiểm đầy đủ theo lương thực nhận
- Du lịch công ty hằng năm
- Làm việc giờ hành chính, nghỉ chiều thứ 7', 1, 'full_time', 'onsite', 0, 2, 'college', 10, 25, 5, CURDATE() + INTERVAL 19 DAY, 'approved', NULL, 1, NOW() - INTERVAL 24 HOUR, NOW() - INTERVAL 24 HOUR, NULL, 152, NOW() - INTERVAL 30 HOUR),
  (23, 11, 12, 33, 'Nhân viên chăm sóc khách hàng', 'nhan-vien-cham-soc-khach-hang-23', '- Trả lời điện thoại, tin nhắn của khách hàng
- Xử lý đổi trả, bảo hành sản phẩm
- Ghi nhận phản hồi lên hệ thống CRM', '- Giọng nói rõ ràng, kỹ năng giao tiếp tốt
- Có kinh nghiệm chăm sóc khách hàng là lợi thế
- Biết dùng CRM, Excel', '- Lương tháng 13, thưởng theo kết quả kinh doanh
- Đóng bảo hiểm đầy đủ theo lương thực nhận
- Du lịch công ty hằng năm
- Làm việc giờ hành chính, nghỉ chiều thứ 7', 2, 'full_time', 'onsite', 0, 1, 'high_school', 8, 11, 4, CURDATE() + INTERVAL 15 DAY, 'approved', NULL, 1, NOW() - INTERVAL 18 HOUR, NOW() - INTERVAL 18 HOUR, NULL, 98, NOW() - INTERVAL 24 HOUR),
  (24, 12, 13, 52, 'Kỹ sư dự toán công trình', 'ky-su-du-toan-cong-trinh-24', '- Bóc tách khối lượng, lập dự toán cho dự án nhà ở và trường học
- Lập hồ sơ thanh quyết toán
- Phối hợp với phòng kỹ thuật kiểm tra bản vẽ', '- Tốt nghiệp kỹ sư xây dựng, 2 năm kinh nghiệm dự toán
- Thành thạo AutoCAD, Excel
- Biết Revit là lợi thế', '- Lương tháng 13, thưởng theo kết quả kinh doanh
- Đóng bảo hiểm đầy đủ theo lương thực nhận
- Du lịch công ty hằng năm
- Làm việc giờ hành chính, nghỉ chiều thứ 7', 1, 'full_time', 'onsite', 2, 5, 'university', 14, 20, 1, CURDATE() + INTERVAL 33 DAY, 'approved', NULL, 1, NOW() - INTERVAL 30 HOUR, NOW() - INTERVAL 30 HOUR, NULL, 87, NOW() - INTERVAL 36 HOUR),
  (25, 12, 13, 53, 'Kỹ sư giám sát thi công', 'ky-su-giam-sat-thi-cong-25', '- Giám sát thi công phần thô và hoàn thiện tại công trường
- Kiểm tra chất lượng vật liệu đầu vào
- Lập nhật ký và báo cáo tiến độ hằng tuần', '- 3 năm kinh nghiệm giám sát thi công
- Đọc bản vẽ AutoCAD
- Biết lập dự toán là lợi thế', '- Lương tháng 13, thưởng theo kết quả kinh doanh
- Đóng bảo hiểm đầy đủ theo lương thực nhận
- Du lịch công ty hằng năm
- Làm việc giờ hành chính, nghỉ chiều thứ 7', 3, 'full_time', 'onsite', 3, 6, 'university', 18, 25, 2, CURDATE() + INTERVAL 27 DAY, 'approved', NULL, 1, NOW() - INTERVAL 56 HOUR, NOW() - INTERVAL 56 HOUR, NULL, 64, NOW() - INTERVAL 62 HOUR),
  (26, 13, 14, 61, 'Giáo viên tiếng Anh (bán thời gian)', 'giao-vien-tieng-anh-ban-thoi-gian-26', '- Dạy lớp thiếu nhi buổi tối và cuối tuần
- Dùng giáo trình có sẵn của trung tâm
- Nhận xét tiến bộ học viên hằng tháng', '- Tiếng Anh tốt, có IELTS 7.0 trở lên
- Có kinh nghiệm giảng dạy
- Kỹ năng giao tiếp với phụ huynh', '- Thù lao theo buổi, thanh toán 2 lần/tháng
- Có giáo trình và trợ giảng hỗ trợ
- Được đào tạo phương pháp giảng dạy', 2, 'part_time', 'onsite', 1, NULL, 'university', 8, 12, 3, CURDATE() + INTERVAL 31 DAY, 'approved', NULL, 1, NOW() - INTERVAL 48 HOUR, NOW() - INTERVAL 48 HOUR, NULL, 120, NOW() - INTERVAL 54 HOUR),
  (27, 1, 2, 71, 'Chuyên viên tuyển dụng', 'chuyen-vien-tuyen-dung-27', '- Tuyển dụng vị trí kỹ thuật cho đội 120 người
- Sàng lọc hồ sơ, sắp xếp phỏng vấn
- Xây dựng kênh tuyển dụng qua mạng xã hội', '- 1 năm kinh nghiệm tuyển dụng, ưu tiên mảng IT
- Kỹ năng giao tiếp tốt
- Biết C&B, Excel là lợi thế', '- Lương tháng 13, thưởng theo kết quả kinh doanh
- Đóng bảo hiểm đầy đủ theo lương thực nhận
- Du lịch công ty hằng năm
- Làm việc giờ hành chính, nghỉ chiều thứ 7', 1, 'full_time', 'onsite', 1, 3, 'university', 12, 16, 1, CURDATE() + INTERVAL 17 DAY, 'approved', NULL, 1, NOW() - INTERVAL 15 HOUR, NOW() - INTERVAL 15 HOUR, NULL, 109, NOW() - INTERVAL 21 HOUR),
  (28, 14, 15, 41, 'Thực tập sinh Marketing', 'thuc-tap-sinh-marketing-28', '- Viết bài giới thiệu giải pháp điện mặt trời trên fanpage
- Thiết kế ảnh đăng bài bằng Canva
- Hỗ trợ chạy quảng cáo Facebook', '- Sinh viên năm 3, năm 4 ngành marketing
- Biết viết content, dùng Canva
- Biết Facebook Ads là lợi thế', '- Lương tháng 13, thưởng theo kết quả kinh doanh
- Đóng bảo hiểm đầy đủ theo lương thực nhận
- Du lịch công ty hằng năm
- Làm việc giờ hành chính, nghỉ chiều thứ 7', 5, 'internship', 'onsite', 0, NULL, 'college', 3, 5, 2, CURDATE() + INTERVAL 20 DAY, 'pending', NULL, NULL, NULL, NULL, NULL, 0, NOW() - INTERVAL 12 HOUR),
  (29, 4, 5, 11, 'Senior .NET Developer', 'senior-net-developer-29', '- Dẫn dắt đội 4 người phát triển hệ thống quản lý bệnh viện
- Thiết kế API bằng ASP.NET Core
- Đánh giá code và hướng dẫn thành viên mới', '- 4 năm kinh nghiệm C#, .NET, SQL Server
- Thiết kế REST API
- Biết Azure, Docker là lợi thế', '- Lương tháng 13 và thưởng dự án
- Bảo hiểm sức khỏe cho nhân viên và người thân
- 15 ngày phép/năm, làm việc từ thứ 2 đến thứ 6
- Ngân sách học khóa học và thi chứng chỉ', 1, 'full_time', 'hybrid', 4, 6, 'university', 35, 50, 1, CURDATE() + INTERVAL 30 DAY, 'pending', NULL, NULL, NULL, NULL, NULL, 0, NOW() - INTERVAL 12 HOUR),
  (30, 10, 11, 11, 'Lập trình viên Golang', 'lap-trinh-vien-golang-30', '- Phát triển dịch vụ chấm công cho hệ thống SaaS
- Tối ưu truy vấn PostgreSQL
- Đóng gói dịch vụ bằng Docker', '- 2 năm kinh nghiệm Go
- Thành thạo PostgreSQL, Docker
- Biết Kubernetes là lợi thế', '- Lương tháng 13 và thưởng dự án
- Bảo hiểm sức khỏe cho nhân viên và người thân
- 15 ngày phép/năm, làm việc từ thứ 2 đến thứ 6
- Ngân sách học khóa học và thi chứng chỉ', 1, 'full_time', 'onsite', 2, 4, 'university', 25, 35, 1, CURDATE() + INTERVAL -5 DAY, 'closed', NULL, 1, NOW() - INTERVAL 840 HOUR, NOW() - INTERVAL 840 HOUR, NOW() - INTERVAL 120 HOUR, 520, NOW() - INTERVAL 846 HOUR),
  (31, 11, 12, 32, 'Nhân viên bán hàng cửa hàng', 'nhan-vien-ban-hang-cua-hang-31', '- Tư vấn sản phẩm gia dụng cho khách tại cửa hàng
- Sắp xếp hàng hóa, kiểm kê cuối ca', '- Nhanh nhẹn, giao tiếp tốt
- Không yêu cầu kinh nghiệm', '- Lương tháng 13, thưởng theo kết quả kinh doanh
- Đóng bảo hiểm đầy đủ theo lương thực nhận
- Du lịch công ty hằng năm
- Làm việc giờ hành chính, nghỉ chiều thứ 7', 2, 'full_time', 'onsite', 0, NULL, 'high_school', NULL, NULL, 6, CURDATE() + INTERVAL 25 DAY, 'rejected', 'Tin chưa ghi mức lương cụ thể. Vui lòng bổ sung khoảng lương để ứng viên dễ cân nhắc.', 1, NOW() - INTERVAL 30 HOUR, NULL, NULL, 0, NOW() - INTERVAL 12 HOUR),
  (32, 1, 2, 14, 'Data Engineer', 'data-engineer-32', '- Xây dựng pipeline thu thập dữ liệu bán hàng
- Thiết kế kho dữ liệu cho báo cáo', '- 2 năm kinh nghiệm Python, SQL
- Biết Docker, AWS là lợi thế', '- Lương tháng 13 và thưởng dự án
- Bảo hiểm sức khỏe cho nhân viên và người thân
- 15 ngày phép/năm, làm việc từ thứ 2 đến thứ 6
- Ngân sách học khóa học và thi chứng chỉ', 1, 'full_time', 'hybrid', 2, 4, 'university', 25, 35, 1, CURDATE() + INTERVAL 40 DAY, 'draft', NULL, NULL, NULL, NULL, NULL, 0, NOW() - INTERVAL 12 HOUR);

-- Kỹ năng của từng tin
INSERT INTO job_skills (job_id, skill_id, is_required) VALUES
  (1, 4, TRUE),
  (1, 1, TRUE),
  (1, 2, TRUE),
  (1, 3, TRUE),
  (1, 13, TRUE),
  (2, 4, TRUE),
  (2, 8, TRUE),
  (2, 2, TRUE),
  (2, 15, TRUE),
  (3, 3, TRUE),
  (3, 1, TRUE),
  (3, 15, TRUE),
  (4, 1, TRUE),
  (4, 3, TRUE),
  (4, 5, TRUE),
  (5, 1, TRUE),
  (5, 11, TRUE),
  (5, 4, TRUE),
  (5, 19, TRUE),
  (6, 3, TRUE),
  (6, 1, TRUE),
  (6, 46, TRUE),
  (7, 36, TRUE),
  (7, 1, TRUE),
  (7, 2, TRUE),
  (8, 1, TRUE),
  (8, 42, TRUE),
  (8, 41, TRUE),
  (8, 15, TRUE),
  (9, 6, TRUE),
  (9, 2, TRUE),
  (9, 54, TRUE),
  (10, 29, TRUE),
  (10, 30, TRUE),
  (10, 19, TRUE),
  (10, 1, TRUE),
  (11, 24, TRUE),
  (11, 26, TRUE),
  (11, 20, TRUE),
  (11, 13, TRUE),
  (11, 16, TRUE),
  (12, 27, TRUE),
  (12, 28, TRUE),
  (12, 19, TRUE),
  (12, 13, TRUE),
  (13, 34, TRUE),
  (13, 35, TRUE),
  (13, 13, TRUE),
  (14, 48, TRUE),
  (14, 24, TRUE),
  (14, 51, TRUE),
  (14, 52, TRUE),
  (15, 16, TRUE),
  (15, 17, TRUE),
  (15, 18, TRUE),
  (15, 58, TRUE),
  (15, 40, TRUE),
  (16, 45, TRUE),
  (16, 48, TRUE),
  (16, 57, TRUE),
  (17, 46, TRUE),
  (17, 47, TRUE),
  (18, 60, TRUE),
  (18, 61, TRUE),
  (18, 63, TRUE),
  (18, 62, TRUE),
  (18, 52, TRUE),
  (19, 64, TRUE),
  (19, 61, TRUE),
  (19, 52, TRUE),
  (20, 68, TRUE),
  (20, 67, TRUE),
  (20, 70, TRUE),
  (21, 69, TRUE),
  (21, 66, TRUE),
  (22, 72, TRUE),
  (22, 73, TRUE),
  (22, 85, TRUE),
  (23, 75, TRUE),
  (23, 85, TRUE),
  (24, 78, TRUE),
  (24, 76, TRUE),
  (24, 52, TRUE),
  (25, 79, TRUE),
  (25, 76, TRUE),
  (26, 82, TRUE),
  (26, 81, TRUE),
  (27, 89, TRUE),
  (27, 85, TRUE),
  (28, 69, TRUE),
  (28, 71, TRUE),
  (29, 31, TRUE),
  (29, 32, TRUE),
  (29, 23, TRUE),
  (29, 13, TRUE),
  (30, 33, TRUE),
  (30, 20, TRUE),
  (30, 16, TRUE),
  (31, 72, TRUE),
  (32, 24, TRUE),
  (32, 48, TRUE),
  (1, 8, FALSE),
  (1, 41, FALSE),
  (2, 7, FALSE),
  (2, 16, FALSE),
  (3, 4, FALSE),
  (4, 4, FALSE),
  (4, 9, FALSE),
  (5, 16, FALSE),
  (6, 10, FALSE),
  (6, 55, FALSE),
  (7, 8, FALSE),
  (7, 39, FALSE),
  (8, 2, FALSE),
  (9, 3, FALSE),
  (10, 5, FALSE),
  (11, 22, FALSE),
  (11, 40, FALSE),
  (12, 17, FALSE),
  (12, 56, FALSE),
  (13, 39, FALSE),
  (13, 15, FALSE),
  (14, 50, FALSE),
  (14, 53, FALSE),
  (15, 24, FALSE),
  (15, 33, FALSE),
  (16, 44, FALSE),
  (16, 43, FALSE),
  (17, 3, FALSE),
  (17, 56, FALSE),
  (18, 82, FALSE),
  (19, 65, FALSE),
  (19, 82, FALSE),
  (20, 69, FALSE),
  (20, 71, FALSE),
  (21, 71, FALSE),
  (21, 70, FALSE),
  (22, 74, FALSE),
  (22, 82, FALSE),
  (23, 74, FALSE),
  (23, 52, FALSE),
  (24, 77, FALSE),
  (25, 78, FALSE),
  (26, 85, FALSE),
  (27, 90, FALSE),
  (27, 52, FALSE),
  (28, 68, FALSE),
  (29, 59, FALSE),
  (29, 16, FALSE),
  (30, 17, FALSE),
  (31, 85, FALSE),
  (32, 16, FALSE),
  (32, 40, FALSE);

-- CV (tạo bằng form; CV của Lê Minh Châu cố ý viết chung chung để minh họa chức năng gợi ý sửa CV)
INSERT INTO cvs (id, candidate_id, title, source, content, template, parse_status, is_default, created_at) VALUES
  (1, 16, 'CV Frontend Developer', 'builder', '{"personal": {"full_name": "Nguyễn Văn An", "email": "an.nguyen@khopviec.vn", "phone": "0981234567", "address": "Cầu Giấy, Hà Nội", "headline": "Frontend Developer (ReactJS)"}, "objective": "Phát triển giao diện web nhanh và dễ dùng với React, TypeScript; trong 2 năm tới đảm nhận vai trò frontend chính của một sản phẩm.", "experiences": [{"company": "Công ty TNHH Phần mềm Bắc Hà", "position": "Frontend Developer", "start": "2025-03", "end": null, "description": "Phát triển trang quản lý bán hàng cho chuỗi 30 cửa hàng bằng React, TypeScript và Redux. Giảm thời gian tải trang danh sách đơn hàng từ 4,2 giây xuống 1,3 giây. Viết 40 component dùng chung cho cả đội."}, {"company": "Công ty TNHH Phần mềm Bắc Hà", "position": "Thực tập sinh Frontend", "start": "2024-09", "end": "2025-02", "description": "Cắt giao diện từ Figma bằng HTML/CSS và Tailwind CSS, kết nối REST API cho module khách hàng."}], "educations": [{"school": "Trường Đại học Công nghệ – ĐHQG Hà Nội", "major": "Công nghệ thông tin", "degree": "Kỹ sư", "start": "2020-09", "end": "2024-06", "gpa": "3.2/4"}], "projects": [{"name": "Website đặt lịch khám bệnh", "role": "Frontend", "start": "2024-02", "end": "2024-05", "description": "Đồ án môn học: React, Node.js, MySQL; 3 thành viên.", "link": null}], "certificates": [{"name": "TOEIC 750", "issuer": "IIG Việt Nam", "year": 2024}], "skills": ["React", "JavaScript", "TypeScript", "HTML/CSS", "Redux", "REST API", "Git", "Tailwind CSS", "Figma", "Node.js"]}', 'classic', 'done', TRUE, NOW() - INTERVAL 240 HOUR),
  (2, 17, 'CV Kế toán tổng hợp', 'builder', '{"personal": {"full_name": "Trần Thị Bình", "email": "binh.tran@khopviec.vn", "phone": "0912345678", "address": "Quận 7, TP. Hồ Chí Minh", "headline": "Kế toán tổng hợp"}, "objective": "Trở thành kế toán trưởng tại một doanh nghiệp thương mại trong 3 năm tới.", "experiences": [{"company": "Công ty TNHH Điện máy Phúc An", "position": "Kế toán tổng hợp", "start": "2023-04", "end": null, "description": "Hạch toán chứng từ cho 12 cửa hàng trên phần mềm MISA, lập báo cáo tài chính quý và năm, kê khai thuế GTGT và quyết toán thuế TNDN. Rút ngắn thời gian khóa sổ cuối tháng từ 7 ngày xuống 4 ngày."}, {"company": "Công ty TNHH Điện máy Phúc An", "position": "Kế toán viên", "start": "2022-07", "end": "2023-03", "description": "Theo dõi công nợ phải thu, đối chiếu ngân hàng hằng ngày bằng Excel."}], "educations": [{"school": "Trường Đại học Kinh tế TP. Hồ Chí Minh", "major": "Kế toán", "degree": "Cử nhân", "start": "2016-09", "end": "2020-06", "gpa": "3.4/4"}], "projects": [], "certificates": [{"name": "Chứng chỉ kế toán trưởng", "issuer": "Bộ Tài chính", "year": 2025}], "skills": ["Kế toán tổng hợp", "Báo cáo tài chính", "Kê khai thuế", "Phần mềm MISA", "Excel", "Tiếng Anh"]}', 'classic', 'done', TRUE, NOW() - INTERVAL 360 HOUR),
  (3, 18, 'CV Digital Marketing', 'builder', '{"personal": {"full_name": "Lê Minh Châu", "email": "chau.le@khopviec.vn", "phone": "0934567890", "address": "Hải Châu, Đà Nẵng", "headline": "Nhân viên Digital Marketing"}, "objective": "Mong muốn được làm việc trong môi trường năng động, chuyên nghiệp để phát triển bản thân.", "experiences": [{"company": "Khách sạn Biển Xanh", "position": "Nhân viên marketing", "start": "2023-06", "end": null, "description": "Chạy quảng cáo Facebook và Google cho khách sạn."}, {"company": "Công ty CP Du lịch Sông Hàn", "position": "Cộng tác viên nội dung", "start": "2022-09", "end": "2023-05", "description": "Viết bài cho fanpage."}], "educations": [{"school": "Trường Đại học Kinh tế – Đại học Đà Nẵng", "major": "Marketing", "degree": "Cử nhân", "start": "2018-09", "end": "2022-06", "gpa": null}], "projects": [], "certificates": [], "skills": ["Facebook Ads", "Google Ads", "Content Marketing", "Canva", "SEO", "Giao tiếp", "Làm việc nhóm"], "strengths": "Chăm chỉ, ham học hỏi, nhiệt tình, chịu được áp lực công việc."}', 'classic', 'done', TRUE, NOW() - INTERVAL 168 HOUR);

INSERT INTO cv_skills (cv_id, skill_id, source) VALUES
  (1, 4, 'parsed'),
  (1, 1, 'parsed'),
  (1, 2, 'parsed'),
  (1, 3, 'parsed'),
  (1, 8, 'parsed'),
  (1, 13, 'parsed'),
  (1, 15, 'parsed'),
  (1, 9, 'parsed'),
  (1, 46, 'parsed'),
  (1, 11, 'parsed'),
  (2, 60, 'parsed'),
  (2, 61, 'parsed'),
  (2, 63, 'parsed'),
  (2, 62, 'parsed'),
  (2, 52, 'parsed'),
  (2, 82, 'parsed'),
  (3, 68, 'parsed'),
  (3, 67, 'parsed'),
  (3, 69, 'parsed'),
  (3, 71, 'parsed'),
  (3, 66, 'parsed'),
  (3, 85, 'parsed'),
  (3, 86, 'parsed');

-- Hồ sơ ứng tuyển và lịch sử trạng thái
INSERT INTO applications (id, job_id, candidate_id, cv_id, cover_letter, status, match_score, match_detail, interview_at, applied_at) VALUES
  (1, 1, 16, 1, 'Em đã đọc kỹ mô tả công việc và mong được trao đổi thêm trong buổi phỏng vấn.', 'interview', 83.83, '{"coverage": 0.9167, "tfidf": 0.64, "semantic": 0.81, "criteria": 1.0}', NOW() + INTERVAL 72 HOUR, NOW() - INTERVAL 40 HOUR),
  (2, 5, 16, 1, 'Em đã đọc kỹ mô tả công việc và mong được trao đổi thêm trong buổi phỏng vấn.', 'submitted', 69.07, '{"coverage": 0.6667, "tfidf": 0.57, "semantic": 0.7, "criteria": 1.0}', NULL, NOW() - INTERVAL 6 HOUR),
  (3, 2, 16, 1, 'Em đã đọc kỹ mô tả công việc và mong được trao đổi thêm trong buổi phỏng vấn.', 'rejected', 75.2, '{"coverage": 0.8, "tfidf": 0.58, "semantic": 0.79, "criteria": 0.8}', NULL, NOW() - INTERVAL 120 HOUR),
  (4, 18, 17, 2, 'Em đã đọc kỹ mô tả công việc và mong được trao đổi thêm trong buổi phỏng vấn.', 'viewed', 88.4, '{"coverage": 1.0, "tfidf": 0.71, "semantic": 0.83, "criteria": 1.0}', NULL, NOW() - INTERVAL 30 HOUR),
  (5, 20, 18, 3, 'Em đã đọc kỹ mô tả công việc và mong được trao đổi thêm trong buổi phỏng vấn.', 'submitted', 66.1, '{"coverage": 0.6667, "tfidf": 0.55, "semantic": 0.72, "criteria": 1.0}', NULL, NOW() - INTERVAL 4 HOUR);

INSERT INTO application_status_history (application_id, from_status, to_status, changed_by, note, created_at) VALUES
  (1, NULL, 'submitted', 16, NULL, NOW() - INTERVAL 40 HOUR),
  (1, 'submitted', 'viewed', 2, NULL, NOW() - INTERVAL 30 HOUR),
  (1, 'viewed', 'interview', 2, 'Mời phỏng vấn tại văn phòng Cầu Giấy, mang theo laptop để làm bài nhỏ.', NOW() - INTERVAL 20 HOUR),
  (2, NULL, 'submitted', 16, NULL, NOW() - INTERVAL 6 HOUR),
  (3, NULL, 'submitted', 16, NULL, NOW() - INTERVAL 120 HOUR),
  (3, 'submitted', 'viewed', 3, NULL, NOW() - INTERVAL 100 HOUR),
  (3, 'viewed', 'rejected', 3, 'Vị trí cần kinh nghiệm Next.js với dự án lớn hơn.', NOW() - INTERVAL 96 HOUR),
  (4, NULL, 'submitted', 17, NULL, NOW() - INTERVAL 30 HOUR),
  (4, 'submitted', 'viewed', 12, NULL, NOW() - INTERVAL 12 HOUR),
  (5, NULL, 'submitted', 18, NULL, NOW() - INTERVAL 4 HOUR);

-- Việc đã lưu
INSERT INTO saved_jobs (candidate_id, job_id, created_at) VALUES
  (16, 4, NOW() - INTERVAL 50 HOUR),
  (16, 11, NOW() - INTERVAL 9 HOUR),
  (17, 19, NOW() - INTERVAL 20 HOUR),
  (18, 21, NOW() - INTERVAL 3 HOUR);

-- Thông báo
INSERT INTO notifications (user_id, type, title, message, link, is_read, created_at) VALUES
  (16, 'application_status', 'Bạn được mời phỏng vấn', 'Công ty CP Công nghệ Sao Mai mời bạn phỏng vấn vị trí Frontend Developer (ReactJS).', '/ho-so-da-nop/1', FALSE, NOW() - INTERVAL 20 HOUR),
  (16, 'application_status', 'Hồ sơ chưa phù hợp', 'Hạ Long Software đã xem và chưa chọn hồ sơ của bạn cho vị trí ReactJS Developer.', '/ho-so-da-nop/3', TRUE, NOW() - INTERVAL 96 HOUR),
  (17, 'application_status', 'Nhà tuyển dụng đã xem hồ sơ', 'Công ty TNHH Thương mại Hòa Bình đã xem hồ sơ Kế toán tổng hợp của bạn.', '/ho-so-da-nop/4', FALSE, NOW() - INTERVAL 12 HOUR),
  (2, 'new_application', 'Có hồ sơ mới', 'Nguyễn Văn An ứng tuyển Frontend Developer (ReactJS), điểm phù hợp 84.', '/nha-tuyen-dung/tin/1/ung-vien', TRUE, NOW() - INTERVAL 40 HOUR),
  (5, 'new_application', 'Có hồ sơ mới', 'Nguyễn Văn An ứng tuyển Web Developer (Fullstack JS), điểm phù hợp 69.', '/nha-tuyen-dung/tin/5/ung-vien', FALSE, NOW() - INTERVAL 6 HOUR),
  (6, 'new_application', 'Có hồ sơ mới', 'Lê Minh Châu ứng tuyển Chuyên viên Digital Marketing, điểm phù hợp 66.', '/nha-tuyen-dung/tin/20/ung-vien', FALSE, NOW() - INTERVAL 4 HOUR),
  (12, 'job_rejected', 'Tin tuyển dụng bị từ chối', 'Tin Nhân viên bán hàng cửa hàng chưa ghi mức lương cụ thể.', '/nha-tuyen-dung/tin/31', FALSE, NOW() - INTERVAL 30 HOUR),
  (1, 'system', 'Có nhà tuyển dụng chờ duyệt', 'Công ty TNHH Giải pháp Xanh vừa đăng ký tài khoản.', '/admin/tai-khoan?trang-thai=pending', FALSE, NOW() - INTERVAL 20 HOUR);
