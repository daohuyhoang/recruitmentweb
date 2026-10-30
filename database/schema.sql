-- =====================================================================
-- KhớpViệc — Cơ sở dữ liệu website tuyển dụng (MySQL 8.0+)
-- Chạy: mysql -u root -p < database/schema.sql
-- Script tạo lại toàn bộ database: MỌI DỮ LIỆU CŨ SẼ BỊ XÓA.
-- =====================================================================

DROP DATABASE IF EXISTS recruitment;
CREATE DATABASE recruitment
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
USE recruitment;

-- ---------------------------------------------------------------------
-- 1. DANH MỤC DÙNG CHUNG
-- ---------------------------------------------------------------------

CREATE TABLE cities (
  id          SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name        VARCHAR(100)      NOT NULL,
  slug        VARCHAR(100)      NOT NULL,
  sort_order  SMALLINT          NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  UNIQUE KEY uq_cities_slug (slug)
) ENGINE=InnoDB COMMENT='Tỉnh/thành phố (34 đơn vị hành chính từ 07/2025)';

CREATE TABLE categories (
  id          INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  parent_id   INT UNSIGNED  NULL COMMENT 'NULL = ngành nghề; có giá trị = nhóm công việc thuộc ngành',
  name        VARCHAR(150)  NOT NULL,
  slug        VARCHAR(150)  NOT NULL,
  description VARCHAR(500)  NULL,
  icon        VARCHAR(50)   NULL COMMENT 'Tên icon Lucide, ví dụ laptop',
  sort_order  SMALLINT      NOT NULL DEFAULT 0,
  is_active   BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_categories_slug (slug),
  KEY ix_categories_parent (parent_id),
  CONSTRAINT fk_categories_parent FOREIGN KEY (parent_id) REFERENCES categories (id) ON DELETE RESTRICT
) ENGINE=InnoDB COMMENT='Ngành nghề (cấp 1) và nhóm công việc (cấp 2)';

CREATE TABLE skills (
  id          INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  name        VARCHAR(100)  NOT NULL COMMENT 'Tên chuẩn hiển thị, ví dụ React',
  slug        VARCHAR(100)  NOT NULL,
  skill_type  ENUM('hard','soft','language','tool') NOT NULL DEFAULT 'hard',
  category_id INT UNSIGNED  NULL COMMENT 'Ngành thường dùng kỹ năng này (để gợi ý)',
  is_active   BOOLEAN       NOT NULL DEFAULT TRUE COMMENT 'Tắt thay vì xóa khi kỹ năng đã được dùng',
  created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_skills_name (name),
  UNIQUE KEY uq_skills_slug (slug),
  KEY ix_skills_category (category_id),
  CONSTRAINT fk_skills_category FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE SET NULL
) ENGINE=InnoDB COMMENT='Từ điển kỹ năng chuẩn, nền tảng của thuật toán 1';

CREATE TABLE skill_aliases (
  id          INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  skill_id    INT UNSIGNED  NOT NULL,
  alias       VARCHAR(100)  NOT NULL COMMENT 'Viết thường, đã chuẩn hóa, ví dụ reactjs',
  PRIMARY KEY (id),
  UNIQUE KEY uq_skill_aliases_alias (alias),
  KEY ix_skill_aliases_skill (skill_id),
  CONSTRAINT fk_skill_aliases_skill FOREIGN KEY (skill_id) REFERENCES skills (id) ON DELETE CASCADE
) ENGINE=InnoDB COMMENT='Từ đồng nghĩa: ReactJS = React.js = React';

CREATE TABLE app_settings (
  setting_key   VARCHAR(100) NOT NULL,
  setting_value JSON         NOT NULL,
  description   VARCHAR(255) NULL,
  updated_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (setting_key)
) ENGINE=InnoDB COMMENT='Cấu hình hệ thống, ví dụ trọng số điểm phù hợp';

-- ---------------------------------------------------------------------
-- 2. TÀI KHOẢN
-- ---------------------------------------------------------------------

CREATE TABLE users (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  email         VARCHAR(255)    NOT NULL,
  password_hash VARCHAR(255)    NOT NULL COMMENT 'bcrypt',
  full_name     VARCHAR(150)    NOT NULL,
  phone         VARCHAR(20)     NULL,
  avatar_url    VARCHAR(500)    NULL,
  role          ENUM('candidate','employer','admin') NOT NULL,
  status        ENUM('active','pending','locked')    NOT NULL DEFAULT 'active'
                COMMENT 'Nhà tuyển dụng mới đăng ký ở trạng thái pending tới khi admin duyệt',
  locked_reason VARCHAR(500)    NULL,
  last_login_at DATETIME        NULL,
  created_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email),
  KEY ix_users_role_status (role, status)
) ENGINE=InnoDB COMMENT='Tài khoản của cả 3 vai trò';

CREATE TABLE candidate_profiles (
  user_id               BIGINT UNSIGNED   NOT NULL,
  headline              VARCHAR(200)      NULL COMMENT 'Vị trí mong muốn, ví dụ Frontend Developer',
  date_of_birth         DATE              NULL,
  gender                ENUM('male','female','other') NULL,
  address               VARCHAR(255)      NULL,
  city_id               SMALLINT UNSIGNED NULL,
  desired_category_id   INT UNSIGNED      NULL,
  desired_salary_min    DECIMAL(6,1)      NULL COMMENT 'Triệu đồng/tháng',
  desired_salary_max    DECIMAL(6,1)      NULL,
  years_of_experience   DECIMAL(3,1)      NULL,
  education_level       ENUM('none','high_school','college','university','master','doctor') NULL,
  summary               TEXT              NULL,
  is_searchable         BOOLEAN           NOT NULL DEFAULT TRUE COMMENT 'Cho phép nhà tuyển dụng tìm thấy hồ sơ',
  updated_at            DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id),
  KEY ix_candidate_profiles_city (city_id),
  CONSTRAINT fk_candidate_profiles_user     FOREIGN KEY (user_id)             REFERENCES users (id)      ON DELETE CASCADE,
  CONSTRAINT fk_candidate_profiles_city     FOREIGN KEY (city_id)             REFERENCES cities (id)     ON DELETE SET NULL,
  CONSTRAINT fk_candidate_profiles_category FOREIGN KEY (desired_category_id) REFERENCES categories (id) ON DELETE SET NULL,
  CONSTRAINT ck_candidate_profiles_salary CHECK (desired_salary_max IS NULL OR desired_salary_min IS NULL OR desired_salary_max >= desired_salary_min)
) ENGINE=InnoDB COMMENT='Hồ sơ cá nhân của ứng viên (1-1 với users)';

CREATE TABLE companies (
  id           INT UNSIGNED      NOT NULL AUTO_INCREMENT,
  owner_id     BIGINT UNSIGNED   NOT NULL COMMENT 'Tài khoản nhà tuyển dụng quản lý công ty',
  name         VARCHAR(255)      NOT NULL,
  slug         VARCHAR(255)      NOT NULL,
  tax_code     VARCHAR(20)       NULL COMMENT 'Mã số thuế',
  logo_url     VARCHAR(500)      NULL,
  website      VARCHAR(255)      NULL,
  email        VARCHAR(255)      NULL,
  phone        VARCHAR(20)       NULL,
  address      VARCHAR(255)      NULL,
  city_id      SMALLINT UNSIGNED NULL,
  company_size ENUM('1-10','11-50','51-200','201-500','500+') NULL,
  description  TEXT              NULL,
  is_verified  BOOLEAN           NOT NULL DEFAULT FALSE COMMENT 'Admin đã xác thực',
  created_at   DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_companies_owner (owner_id),
  UNIQUE KEY uq_companies_slug (slug),
  UNIQUE KEY uq_companies_tax_code (tax_code),
  KEY ix_companies_city (city_id),
  CONSTRAINT fk_companies_owner FOREIGN KEY (owner_id) REFERENCES users (id)  ON DELETE RESTRICT,
  CONSTRAINT fk_companies_city  FOREIGN KEY (city_id)  REFERENCES cities (id) ON DELETE SET NULL
) ENGINE=InnoDB COMMENT='Công ty (1 tài khoản nhà tuyển dụng quản lý 1 công ty)';

-- ---------------------------------------------------------------------
-- 3. TIN TUYỂN DỤNG
-- ---------------------------------------------------------------------

CREATE TABLE jobs (
  id                    BIGINT UNSIGNED   NOT NULL AUTO_INCREMENT,
  company_id            INT UNSIGNED      NOT NULL,
  created_by            BIGINT UNSIGNED   NULL,
  category_id           INT UNSIGNED      NOT NULL COMMENT 'Nhóm công việc (cấp 2)',
  title                 VARCHAR(255)      NOT NULL,
  slug                  VARCHAR(300)      NOT NULL,
  description           TEXT              NOT NULL COMMENT 'Mô tả công việc',
  requirements          TEXT              NOT NULL COMMENT 'Yêu cầu ứng viên',
  benefits              TEXT              NULL COMMENT 'Quyền lợi',
  city_id               SMALLINT UNSIGNED NOT NULL,
  address               VARCHAR(255)      NULL,
  employment_type       ENUM('full_time','part_time','internship','contract') NOT NULL DEFAULT 'full_time',
  work_mode             ENUM('onsite','remote','hybrid') NOT NULL DEFAULT 'onsite',
  experience_min_years  DECIMAL(3,1)      NOT NULL DEFAULT 0,
  experience_max_years  DECIMAL(3,1)      NULL,
  education_level       ENUM('none','high_school','college','university','master','doctor') NOT NULL DEFAULT 'none'
                        COMMENT 'Trình độ tối thiểu',
  salary_min            DECIMAL(6,1)      NULL COMMENT 'Triệu đồng/tháng; NULL = thỏa thuận',
  salary_max            DECIMAL(6,1)      NULL,
  vacancies             SMALLINT UNSIGNED NOT NULL DEFAULT 1,
  deadline              DATE              NOT NULL COMMENT 'Hạn nộp; quá hạn thì tin tự đóng',
  status                ENUM('draft','pending','approved','rejected','closed') NOT NULL DEFAULT 'pending',
  rejection_reason      VARCHAR(500)      NULL,
  reviewed_by           BIGINT UNSIGNED   NULL COMMENT 'Admin đã duyệt/từ chối',
  reviewed_at           DATETIME          NULL,
  published_at          DATETIME          NULL COMMENT 'Thời điểm được duyệt lần đầu',
  closed_at             DATETIME          NULL,
  view_count            INT UNSIGNED      NOT NULL DEFAULT 0,
  created_at            DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at            DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_jobs_slug (slug),
  KEY ix_jobs_status_deadline (status, deadline),
  KEY ix_jobs_company (company_id),
  KEY ix_jobs_category (category_id),
  KEY ix_jobs_city (city_id),
  KEY ix_jobs_published (published_at),
  FULLTEXT KEY ft_jobs_text (title, description, requirements) WITH PARSER ngram,
  CONSTRAINT fk_jobs_company     FOREIGN KEY (company_id)  REFERENCES companies (id)  ON DELETE CASCADE,
  CONSTRAINT fk_jobs_created_by  FOREIGN KEY (created_by)  REFERENCES users (id)      ON DELETE SET NULL,
  CONSTRAINT fk_jobs_category    FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE RESTRICT,
  CONSTRAINT fk_jobs_city        FOREIGN KEY (city_id)     REFERENCES cities (id)     ON DELETE RESTRICT,
  CONSTRAINT fk_jobs_reviewed_by FOREIGN KEY (reviewed_by) REFERENCES users (id)      ON DELETE SET NULL,
  CONSTRAINT ck_jobs_salary     CHECK (salary_max IS NULL OR salary_min IS NULL OR salary_max >= salary_min),
  CONSTRAINT ck_jobs_experience CHECK (experience_max_years IS NULL OR experience_max_years >= experience_min_years)
) ENGINE=InnoDB COMMENT='Tin tuyển dụng';

CREATE TABLE job_skills (
  job_id      BIGINT UNSIGNED NOT NULL,
  skill_id    INT UNSIGNED    NOT NULL,
  is_required BOOLEAN         NOT NULL DEFAULT TRUE COMMENT 'TRUE = bắt buộc (trọng số 2), FALSE = ưu tiên (trọng số 1)',
  PRIMARY KEY (job_id, skill_id),
  KEY ix_job_skills_skill (skill_id),
  CONSTRAINT fk_job_skills_job   FOREIGN KEY (job_id)   REFERENCES jobs (id)   ON DELETE CASCADE,
  CONSTRAINT fk_job_skills_skill FOREIGN KEY (skill_id) REFERENCES skills (id) ON DELETE RESTRICT
) ENGINE=InnoDB COMMENT='Kỹ năng job yêu cầu';

CREATE TABLE job_vectors (
  job_id          BIGINT UNSIGNED NOT NULL,
  segmented_text  MEDIUMTEXT      NOT NULL COMMENT 'Văn bản đã tách từ tiếng Việt, đầu vào TF-IDF',
  embedding       JSON            NULL COMMENT 'Vector Sentence-BERT (mảng số thực)',
  embedding_model VARCHAR(150)    NULL,
  updated_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (job_id),
  CONSTRAINT fk_job_vectors_job FOREIGN KEY (job_id) REFERENCES jobs (id) ON DELETE CASCADE
) ENGINE=InnoDB COMMENT='Dữ liệu tính sẵn cho thuật toán 2 và 3';

-- ---------------------------------------------------------------------
-- 4. CV
-- ---------------------------------------------------------------------

CREATE TABLE cvs (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  candidate_id  BIGINT UNSIGNED NOT NULL,
  title         VARCHAR(150)    NOT NULL COMMENT 'Tên CV do ứng viên đặt',
  source        ENUM('upload','builder') NOT NULL COMMENT 'upload = tải file lên; builder = tạo bằng form',
  file_path     VARCHAR(500)    NULL COMMENT 'Đường dẫn file gốc (chỉ với upload)',
  file_name     VARCHAR(255)    NULL,
  file_size     INT UNSIGNED    NULL COMMENT 'Byte',
  mime_type     VARCHAR(100)    NULL,
  raw_text      MEDIUMTEXT      NULL COMMENT 'Văn bản trích từ file',
  content       JSON            NULL COMMENT 'CV có cấu trúc: thông tin, mục tiêu, kinh nghiệm, học vấn, dự án, chứng chỉ, kỹ năng',
  template      VARCHAR(50)     NOT NULL DEFAULT 'classic' COMMENT 'Mẫu khi xuất PDF',
  parse_status  ENUM('pending','done','failed') NOT NULL DEFAULT 'pending',
  parse_error   VARCHAR(500)    NULL,
  is_default    BOOLEAN         NOT NULL DEFAULT FALSE COMMENT 'CV dùng để gợi ý Top 10',
  deleted_at    DATETIME        NULL COMMENT 'Xóa mềm: CV đã dùng ứng tuyển vẫn phải giữ cho nhà tuyển dụng xem',
  created_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_cvs_candidate (candidate_id, deleted_at),
  CONSTRAINT fk_cvs_candidate FOREIGN KEY (candidate_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB COMMENT='CV của ứng viên';

CREATE TABLE cv_skills (
  cv_id     BIGINT UNSIGNED NOT NULL,
  skill_id  INT UNSIGNED    NOT NULL,
  source    ENUM('parsed','manual') NOT NULL DEFAULT 'parsed' COMMENT 'parsed = hệ thống đọc từ CV; manual = ứng viên tự thêm',
  PRIMARY KEY (cv_id, skill_id),
  KEY ix_cv_skills_skill (skill_id),
  CONSTRAINT fk_cv_skills_cv    FOREIGN KEY (cv_id)    REFERENCES cvs (id)    ON DELETE CASCADE,
  CONSTRAINT fk_cv_skills_skill FOREIGN KEY (skill_id) REFERENCES skills (id) ON DELETE RESTRICT
) ENGINE=InnoDB COMMENT='Kỹ năng có trong CV (sau chuẩn hóa)';

CREATE TABLE cv_vectors (
  cv_id           BIGINT UNSIGNED NOT NULL,
  segmented_text  MEDIUMTEXT      NOT NULL,
  embedding       JSON            NULL,
  embedding_model VARCHAR(150)    NULL,
  updated_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (cv_id),
  CONSTRAINT fk_cv_vectors_cv FOREIGN KEY (cv_id) REFERENCES cvs (id) ON DELETE CASCADE
) ENGINE=InnoDB COMMENT='Dữ liệu tính sẵn của CV cho thuật toán 2 và 3';

CREATE TABLE cv_evaluations (
  id            BIGINT UNSIGNED  NOT NULL AUTO_INCREMENT,
  cv_id         BIGINT UNSIGNED  NOT NULL,
  job_id        BIGINT UNSIGNED  NULL COMMENT 'NULL = đánh giá chung; có giá trị = đánh giá theo job',
  overall_score TINYINT UNSIGNED NOT NULL COMMENT '0..100',
  issues        JSON             NOT NULL COMMENT 'Danh sách {section, severity, message, suggestion}',
  created_at    DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_cv_evaluations_cv (cv_id, created_at),
  CONSTRAINT fk_cv_evaluations_cv  FOREIGN KEY (cv_id)  REFERENCES cvs (id)  ON DELETE CASCADE,
  CONSTRAINT fk_cv_evaluations_job FOREIGN KEY (job_id) REFERENCES jobs (id) ON DELETE SET NULL,
  CONSTRAINT ck_cv_evaluations_score CHECK (overall_score <= 100)
) ENGINE=InnoDB COMMENT='Kết quả chức năng 3: đánh giá và gợi ý sửa CV';

-- ---------------------------------------------------------------------
-- 5. SO KHỚP
-- ---------------------------------------------------------------------

CREATE TABLE match_results (
  cv_id          BIGINT UNSIGNED NOT NULL,
  job_id         BIGINT UNSIGNED NOT NULL,
  total_score    DECIMAL(5,2)    NOT NULL COMMENT '0..100',
  coverage_score DECIMAL(5,4)    NOT NULL COMMENT 'Thuật toán 1, 0..1',
  tfidf_score    DECIMAL(5,4)    NOT NULL COMMENT 'Thuật toán 2, 0..1',
  semantic_score DECIMAL(5,4)    NULL     COMMENT 'Thuật toán 3, 0..1; NULL nếu chưa có embedding',
  criteria_score DECIMAL(5,4)    NOT NULL COMMENT 'Kinh nghiệm, học vấn, địa điểm, 0..1',
  matched_skills JSON            NOT NULL COMMENT 'Mảng skill_id có trong CV',
  missing_skills JSON            NOT NULL COMMENT 'Mảng skill_id job yêu cầu nhưng CV chưa có',
  computed_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (cv_id, job_id),
  KEY ix_match_results_job_score (job_id, total_score),
  KEY ix_match_results_cv_score (cv_id, total_score),
  CONSTRAINT fk_match_results_cv  FOREIGN KEY (cv_id)  REFERENCES cvs (id)  ON DELETE CASCADE,
  CONSTRAINT fk_match_results_job FOREIGN KEY (job_id) REFERENCES jobs (id) ON DELETE CASCADE
) ENGINE=InnoDB COMMENT='Cache điểm phù hợp CV–job; dùng cho Top 10 và xếp hạng ứng viên';

CREATE TABLE relevance_labels (
  cv_id      BIGINT UNSIGNED  NOT NULL,
  job_id     BIGINT UNSIGNED  NOT NULL,
  relevance  TINYINT UNSIGNED NOT NULL COMMENT '0 = không phù hợp, 1 = tạm phù hợp, 2 = rất phù hợp',
  labeled_by BIGINT UNSIGNED  NULL,
  created_at DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (cv_id, job_id),
  KEY ix_relevance_labels_job (job_id),
  CONSTRAINT fk_relevance_labels_cv   FOREIGN KEY (cv_id)      REFERENCES cvs (id)   ON DELETE CASCADE,
  CONSTRAINT fk_relevance_labels_job  FOREIGN KEY (job_id)     REFERENCES jobs (id)  ON DELETE CASCADE,
  CONSTRAINT fk_relevance_labels_user FOREIGN KEY (labeled_by) REFERENCES users (id) ON DELETE SET NULL,
  CONSTRAINT ck_relevance_labels_value CHECK (relevance <= 2)
) ENGINE=InnoDB COMMENT='Nhãn đánh giá thủ công để tính Precision@10, NDCG@10 trong thực nghiệm';

-- ---------------------------------------------------------------------
-- 6. ỨNG TUYỂN
-- ---------------------------------------------------------------------

CREATE TABLE applications (
  id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  job_id         BIGINT UNSIGNED NOT NULL,
  candidate_id   BIGINT UNSIGNED NOT NULL,
  cv_id          BIGINT UNSIGNED NOT NULL,
  cover_letter   TEXT            NULL COMMENT 'Thư giới thiệu',
  status         ENUM('submitted','viewed','interview','accepted','rejected','withdrawn') NOT NULL DEFAULT 'submitted'
                 COMMENT 'Đã nộp → Đã xem → Phỏng vấn → Đạt/Từ chối; ứng viên có thể rút hồ sơ',
  match_score    DECIMAL(5,2)    NULL COMMENT 'Điểm phù hợp lúc nộp, để xếp hạng ứng viên',
  match_detail   JSON            NULL COMMENT 'Điểm thành phần lúc nộp',
  employer_note  TEXT            NULL COMMENT 'Ghi chú nội bộ của nhà tuyển dụng',
  interview_at   DATETIME        NULL,
  applied_at     DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_applications_job_candidate (job_id, candidate_id),
  KEY ix_applications_candidate (candidate_id, applied_at),
  KEY ix_applications_job_status (job_id, status),
  KEY ix_applications_cv (cv_id),
  CONSTRAINT fk_applications_job       FOREIGN KEY (job_id)       REFERENCES jobs (id)  ON DELETE CASCADE,
  CONSTRAINT fk_applications_candidate FOREIGN KEY (candidate_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_applications_cv        FOREIGN KEY (cv_id)        REFERENCES cvs (id)   ON DELETE RESTRICT
) ENGINE=InnoDB COMMENT='Hồ sơ ứng tuyển';

CREATE TABLE application_status_history (
  id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  application_id BIGINT UNSIGNED NOT NULL,
  from_status    ENUM('submitted','viewed','interview','accepted','rejected','withdrawn') NULL,
  to_status      ENUM('submitted','viewed','interview','accepted','rejected','withdrawn') NOT NULL,
  changed_by     BIGINT UNSIGNED NULL,
  note           VARCHAR(500)    NULL,
  created_at     DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_status_history_application (application_id, created_at),
  CONSTRAINT fk_status_history_application FOREIGN KEY (application_id) REFERENCES applications (id) ON DELETE CASCADE,
  CONSTRAINT fk_status_history_user        FOREIGN KEY (changed_by)     REFERENCES users (id)        ON DELETE SET NULL
) ENGINE=InnoDB COMMENT='Lịch sử trạng thái, để ứng viên theo dõi tiến trình';

CREATE TABLE saved_jobs (
  candidate_id BIGINT UNSIGNED NOT NULL,
  job_id       BIGINT UNSIGNED NOT NULL,
  created_at   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (candidate_id, job_id),
  KEY ix_saved_jobs_job (job_id),
  CONSTRAINT fk_saved_jobs_candidate FOREIGN KEY (candidate_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_saved_jobs_job       FOREIGN KEY (job_id)       REFERENCES jobs (id)  ON DELETE CASCADE
) ENGINE=InnoDB COMMENT='Việc làm ứng viên đã lưu';

CREATE TABLE notifications (
  id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id    BIGINT UNSIGNED NOT NULL,
  type       ENUM('application_status','new_application','job_approved','job_rejected','job_expired','account_approved','account_locked','system')
             NOT NULL,
  title      VARCHAR(255)    NOT NULL,
  message    VARCHAR(1000)   NULL,
  link       VARCHAR(500)    NULL COMMENT 'Đường dẫn trong web, ví dụ /ho-so-da-nop/12',
  is_read    BOOLEAN         NOT NULL DEFAULT FALSE,
  created_at DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_notifications_user_read (user_id, is_read, created_at),
  CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB COMMENT='Thông báo trong hệ thống';

-- ---------------------------------------------------------------------
-- 7. VIEW HỖ TRỢ
-- ---------------------------------------------------------------------

-- Tin đang hiển thị công khai: đã duyệt và còn hạn
CREATE VIEW v_open_jobs AS
SELECT j.*
FROM jobs j
WHERE j.status = 'approved'
  AND j.deadline >= CURDATE();

-- Số liệu cho trang thống kê của admin
CREATE VIEW v_admin_stats AS
SELECT
  (SELECT COUNT(*) FROM users WHERE role = 'candidate')                       AS total_candidates,
  (SELECT COUNT(*) FROM users WHERE role = 'employer')                        AS total_employers,
  (SELECT COUNT(*) FROM users WHERE role = 'employer' AND status = 'pending') AS pending_employers,
  (SELECT COUNT(*) FROM jobs)                                                 AS total_jobs,
  (SELECT COUNT(*) FROM jobs WHERE status = 'pending')                        AS pending_jobs,
  (SELECT COUNT(*) FROM v_open_jobs)                                          AS open_jobs,
  (SELECT COUNT(*) FROM applications)                                         AS total_applications,
  (SELECT COUNT(*) FROM applications WHERE applied_at >= CURDATE() - INTERVAL 30 DAY) AS applications_last_30_days;

-- ---------------------------------------------------------------------
-- 8. TỰ ĐỘNG ĐÓNG TIN QUÁ HẠN (cần event_scheduler = ON, mặc định của MySQL 8)
-- ---------------------------------------------------------------------

CREATE EVENT ev_close_expired_jobs
  ON SCHEDULE EVERY 1 HOUR
  STARTS CURRENT_TIMESTAMP
  DO
    UPDATE jobs
    SET status = 'closed', closed_at = NOW()
    WHERE status = 'approved' AND deadline < CURDATE();
