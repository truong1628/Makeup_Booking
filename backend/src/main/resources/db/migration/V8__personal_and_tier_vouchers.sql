-- ==============================================================================
-- V8__personal_and_tier_vouchers.sql
-- Nâng cấp hệ thống Voucher: Giới hạn mỗi người dùng, Phân hạng thành viên, Ví Voucher cá nhân
-- ==============================================================================

-- 1. Bổ sung các cột vào bảng vouchers
ALTER TABLE vouchers
    ADD COLUMN user_usage_limit INT NULL DEFAULT 1 AFTER usage_limit,
    ADD COLUMN target_tier VARCHAR(20) NOT NULL DEFAULT 'ALL' AFTER user_usage_limit,
    ADD COLUMN voucher_scope VARCHAR(20) NOT NULL DEFAULT 'PUBLIC' AFTER target_tier;

-- 2. Cập nhật dữ liệu phân loại cho các voucher có sẵn
UPDATE vouchers SET user_usage_limit = 1, target_tier = 'NEW', voucher_scope = 'PUBLIC' WHERE code = 'WELCOME10';
UPDATE vouchers SET user_usage_limit = 1, target_tier = 'ALL', voucher_scope = 'PUBLIC' WHERE code = 'BEAUTY50K';
UPDATE vouchers SET user_usage_limit = 2, target_tier = 'ALL', voucher_scope = 'PUBLIC' WHERE code = 'BRIDAL15';
UPDATE vouchers SET user_usage_limit = 1, target_tier = 'VIP', voucher_scope = 'PUBLIC' WHERE code = 'VIP2024';

-- 3. Tạo bảng ví voucher cá nhân (user_vouchers)
CREATE TABLE IF NOT EXISTS user_vouchers (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    voucher_id BIGINT NOT NULL,
    is_used BOOLEAN NOT NULL DEFAULT FALSE,
    used_at DATETIME NULL,
    assigned_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    assigned_by VARCHAR(100) NULL DEFAULT 'ADMIN',
    note VARCHAR(255) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_user_vouchers_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_user_vouchers_voucher FOREIGN KEY (voucher_id) REFERENCES vouchers(id) ON DELETE CASCADE,
    INDEX idx_uv_user (user_id),
    INDEX idx_uv_voucher (voucher_id),
    INDEX idx_uv_used (is_used)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Thêm voucher cá nhân mẫu và voucher theo hạng (Đảm bảo đủ tối thiểu 5 bản ghi trong bảng vouchers & user_vouchers)
INSERT INTO vouchers (code, name, description, discount_type, discount_value, max_discount_amount, min_order_amount, start_date, end_date, usage_limit, used_count, user_usage_limit, target_tier, voucher_scope, active)
VALUES
('MYGIFT100K', 'Quà Tặng Sinh Nhật 100.000đ', 'Voucher đặc quyền dành riêng trong ví của bạn nhân dịp đặc biệt.', 'FIXED_AMOUNT', 100000.00, 100000.00, 300000.00, NOW() - INTERVAL 1 DAY, NOW() + INTERVAL 90 DAY, 10, 0, 1, 'ALL', 'PERSONAL', TRUE),
('SILVERSTAR', 'Ưu Đãi Đặc Quyền Hạng Bạc 12%', 'Dành riêng cho khách hàng đạt cấp bậc Bạc (Silver).', 'PERCENTAGE', 12.00, 150000.00, 350000.00, NOW() - INTERVAL 1 DAY, NOW() + INTERVAL 90 DAY, 200, 5, 2, 'SILVER', 'PUBLIC', TRUE),
('GOLDENLADY', 'Đặc Quyền Nàng Thơ Vàng 18%', 'Dành riêng cho khách hàng VIP hạng Vàng (Gold) thân thiết.', 'PERCENTAGE', 18.00, 250000.00, 450000.00, NOW() - INTERVAL 1 DAY, NOW() + INTERVAL 90 DAY, 100, 3, 2, 'GOLD', 'PUBLIC', TRUE)
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- 5. Gán 5 bản ghi voucher cá nhân vào bảng user_vouchers
INSERT INTO user_vouchers (user_id, voucher_id, is_used, note, assigned_by)
SELECT u.id, v.id, FALSE, 'Quà tặng chào mừng vào ví cá nhân DungDorys', 'STUDIO_VIP'
FROM users u, vouchers v
WHERE u.email = 'customer@gmail.com' AND v.code = 'MYGIFT100K';
