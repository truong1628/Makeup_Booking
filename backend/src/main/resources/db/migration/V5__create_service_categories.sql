-- 1. Tạo bảng service_categories (Danh mục phân loại dịch vụ trang điểm)
CREATE TABLE IF NOT EXISTS service_categories (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    icon VARCHAR(50) NULL,
    description TEXT NULL,
    display_order INT NOT NULL DEFAULT 0,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_category_code (code),
    INDEX idx_category_active (active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Thêm cột khóa ngoại category_id vào bảng makeup_services
ALTER TABLE makeup_services 
    ADD COLUMN category_id BIGINT NULL AFTER id,
    ADD CONSTRAINT fk_service_category FOREIGN KEY (category_id) REFERENCES service_categories(id) ON DELETE SET NULL;

-- 3. Khởi tạo 6 danh mục dịch vụ chuẩn mực
INSERT INTO service_categories (name, code, icon, description, display_order, active)
VALUES
('Trang Điểm Cô Dâu', 'BRIDAL', 'Heart', 'Trang điểm cô dâu ngày cưới, lễ ăn hỏi, đón dâu sang trọng, lộng lẫy và bền màu suốt cả ngày dài.', 1, TRUE),
('Dự Tiệc & Sự Kiện', 'PARTY', 'Sparkles', 'Trang điểm dạ tiệc, gala dinner, lễ trao giải, phong cách nổi bật cuốn hút dưới ánh đèn sân khấu.', 2, TRUE),
('Chụp Ảnh & Profile', 'PHOTO', 'Camera', 'Trang điểm chụp kỷ yếu, lookbook thời trang, ảnh thẻ nghệ thuật và chân dung doanh nhân.', 3, TRUE),
('Tự Nhiên Hàng Ngày', 'NATURAL', 'Flower2', 'Phong cách trang điểm nhẹ nhàng, trong veo chuẩn phong cách Hàn Quốc cho sinh hoạt và dạo phố.', 4, TRUE),
('Làm Tóc & Phụ Kiện', 'HAIR', 'Scissors', 'Tạo kiểu tóc cô dâu, tóc dạ tiệc bồng bềnh kết hợp hoa tươi và phụ kiện cài tóc cao cấp.', 5, TRUE),
('Gói Combo Trọn Gói', 'COMBO', 'Layers', 'Gói dịch vụ kết hợp trang điểm kèm làm tóc và phụ kiện trọn gói, tiết kiệm tối ưu chi phí.', 6, TRUE)
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- 4. Tự động gán category_id cho các dịch vụ ban đầu trong hệ thống
-- Dịch vụ 1 (Cô dâu) -> BRIDAL
UPDATE makeup_services ms
JOIN service_categories sc ON sc.code = 'BRIDAL'
SET ms.category_id = sc.id
WHERE ms.id = 1;

-- Dịch vụ 2 (Tóc cô dâu) -> HAIR
UPDATE makeup_services ms
JOIN service_categories sc ON sc.code = 'HAIR'
SET ms.category_id = sc.id
WHERE ms.id = 2;

-- Dịch vụ 3 (Dán mi & chăm sóc da) -> BRIDAL
UPDATE makeup_services ms
JOIN service_categories sc ON sc.code = 'BRIDAL'
SET ms.category_id = sc.id
WHERE ms.id = 3;

-- Dịch vụ 4 (Trang điểm mẹ cô dâu/chú rể) -> PARTY
UPDATE makeup_services ms
JOIN service_categories sc ON sc.code = 'PARTY'
SET ms.category_id = sc.id
WHERE ms.id = 4;

-- Dịch vụ 5 (Combo cô dâu hoàn hảo) -> COMBO
UPDATE makeup_services ms
JOIN service_categories sc ON sc.code = 'COMBO'
SET ms.category_id = sc.id
WHERE ms.id = 5 OR ms.is_combo = TRUE;
