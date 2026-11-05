-- ==============================================================================
-- V7__create_vouchers.sql
-- Chuẩn hóa module Khuyến Mãi / Voucher (Vouchers & Discount Promotion Module)
-- ==============================================================================

-- 1. Dọn dẹp các bảng chuyên môn riêng biệt (Do mọi Artist đều thành thạo toàn diện tất cả phong cách)
DROP TABLE IF EXISTS artist_specialties;
DROP TABLE IF EXISTS specialties;

-- 2. Tạo bảng vouchers (Quản lý mã giảm giá, khuyến mãi và điều kiện áp dụng)
CREATE TABLE IF NOT EXISTS vouchers (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    description TEXT NULL,
    discount_type VARCHAR(20) NOT NULL DEFAULT 'PERCENTAGE',
    discount_value DECIMAL(12,2) NOT NULL,
    max_discount_amount DECIMAL(12,2) NULL,
    min_order_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    start_date DATETIME NULL,
    end_date DATETIME NULL,
    usage_limit INT NULL,
    used_count INT NOT NULL DEFAULT 0,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_voucher_code (code),
    INDEX idx_voucher_active (active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Bổ sung các trường liên kết khuyến mãi vào bảng bookings
ALTER TABLE bookings
    ADD COLUMN voucher_id BIGINT NULL AFTER layout_id,
    ADD COLUMN voucher_code VARCHAR(50) NULL AFTER voucher_id,
    ADD COLUMN discount_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00 AFTER voucher_code;

ALTER TABLE bookings
    ADD CONSTRAINT fk_booking_voucher FOREIGN KEY (voucher_id) REFERENCES vouchers(id) ON DELETE SET NULL;

-- 4. Nạp dữ liệu khuyến mãi ban đầu hấp dẫn cho khách hàng sử dụng ngay
INSERT INTO vouchers (code, name, description, discount_type, discount_value, max_discount_amount, min_order_amount, start_date, end_date, usage_limit, used_count, active)
VALUES
('WELCOME10', 'Giảm 10% Chào Mừng Khách Hàng Mới', 'Áp dụng cho mọi khách hàng đặt lịch trải nghiệm lần đầu tại hệ thống.', 'PERCENTAGE', 10.00, 100000.00, 200000.00, NOW() - INTERVAL 1 DAY, NOW() + INTERVAL 90 DAY, 500, 12, TRUE),
('BEAUTY50K', 'Giảm Trực Tiếp 50.000đ', 'Tặng ngay 50.000đ cho đơn đặt dịch vụ từ 400.000đ trở lên.', 'FIXED_AMOUNT', 50000.00, 50000.00, 400000.00, NOW() - INTERVAL 1 DAY, NOW() + INTERVAL 60 DAY, 200, 35, TRUE),
('BRIDAL15', 'Ưu Đãi Cô Dâu Hạnh Phúc 15%', 'Dành riêng cho các gói dịch vụ trang điểm cô dâu ngày cưới hoặc lễ ăn hỏi.', 'PERCENTAGE', 15.00, 300000.00, 1000000.00, NOW() - INTERVAL 1 DAY, NOW() + INTERVAL 120 DAY, 100, 8, TRUE),
('VIP2024', 'Tri Ân Khách Hàng VIP 20%', 'Khuyến mãi đặc biệt 20% (tối đa 200.000đ) khi đặt lịch nhóm từ 500.000đ.', 'PERCENTAGE', 20.00, 200000.00, 500000.00, NOW() - INTERVAL 1 DAY, NOW() + INTERVAL 180 DAY, 50, 19, TRUE)
ON DUPLICATE KEY UPDATE name = VALUES(name);
