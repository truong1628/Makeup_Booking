-- 1. Tạo bảng makeup_layouts (Danh mục phong cách trang điểm)
CREATE TABLE IF NOT EXISTS makeup_layouts (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    description TEXT NULL,
    suitable_for VARCHAR(255) NULL,
    tag VARCHAR(50) NULL,
    gradient VARCHAR(100) NULL,
    border_active VARCHAR(100) NULL,
    badge_class VARCHAR(100) NULL,
    category VARCHAR(50) NULL,
    search_keyword VARCHAR(50) NULL,
    thumbnail_url VARCHAR(500) NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    display_order INT NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_layout_code (code),
    INDEX idx_layout_active (active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Thêm cột khóa ngoại layout_id vào bảng bookings
ALTER TABLE bookings 
    ADD COLUMN layout_id BIGINT NULL AFTER deposit_amount,
    ADD CONSTRAINT fk_booking_layout FOREIGN KEY (layout_id) REFERENCES makeup_layouts(id) ON DELETE SET NULL;

-- 3. Khởi tạo sẵn 6 phong cách Makeup mặc định chuẩn hóa
INSERT INTO makeup_layouts (name, code, description, suitable_for, tag, gradient, border_active, badge_class, category, search_keyword, active, display_order)
VALUES 
('Tone Douyin / Baby Trong Trẻo', 'DOUYIN', 'Mắt long lanh nhũ bắt sáng, má hồng baby phớt cam đào, môi mọng juicy trong veo ngây thơ.', 'Mặt tròn, trái xoan, chụp ảnh kỷ yếu, tiệc trẻ trung, sự kiện ngoài trời.', 'Hot Trend', 'from-pink-500/10 via-rose-500/5 to-white', 'border-pink-500 ring-2 ring-pink-500/20 bg-pink-50/40', 'bg-pink-100 text-pink-700 border-pink-200', 'Dự Tiệc', 'Douyin', TRUE, 1),
('Tone Hàn Quốc / Glass Skin Tự Nhiên', 'KOREAN', 'Lớp nền mỏng nhẹ căng bóng dewy, chân mày phẩy sợi nhẹ nhàng, tone cam đào hoặc san hô chuẩn Hàn.', 'Phù hợp mọi khuôn mặt, đi tiệc nhẹ, sự kiện ban ngày, cô dâu lễ ăn hỏi.', 'Thanh Lịch', 'from-amber-500/10 via-orange-500/5 to-white', 'border-amber-500 ring-2 ring-amber-500/20 bg-amber-50/40', 'bg-amber-100 text-amber-800 border-amber-200', 'Hàn Quốc', 'Hàn Quốc', TRUE, 2),
('Tone Tây Nâu / Glamour Sắc Sảo', 'WESTERN', 'Tạo khối gò má góc cạnh, mắt khói nâu cut-crease hút hồn, son nude đất lì sắc sảo sang trọng.', 'Khuôn mặt góc cạnh, tiệc tối gala, chụp lookbook thời trang, dạ hội cao cấp.', 'Quyến Rũ', 'from-stone-500/10 via-amber-700/5 to-white', 'border-stone-600 ring-2 ring-stone-600/20 bg-stone-50/50', 'bg-stone-200 text-stone-800 border-stone-300', 'Thời Trang', 'Tây', TRUE, 3),
('Tone Thái Lan / Glowy Sắc Nét', 'THAI', 'Lông mày cong sắc nét, mi cong vút tơi đều, tone cam đất ấm áp tạo chiều sâu hút mọi ánh nhìn.', 'Mặt dài, mặt vuông, nước da ngăm khỏe khoắn hoặc bánh mật tôn nét.', 'Ấn Tượng', 'from-orange-500/10 via-rose-500/5 to-white', 'border-orange-500 ring-2 ring-orange-500/20 bg-orange-50/40', 'bg-orange-100 text-orange-800 border-orange-200', 'Tone Thái', 'Thái', TRUE, 4),
('Tone Cổ Điển / Vintage Classic Red', 'VINTAGE', 'Eyeliner mắt mèo sắc lẹm, làn da sứ mịn như nhung, màu son đỏ thuần quyền lực phong cách minh tinh.', 'Tiệc cưới sang trọng, dạ tiệc đêm, phong cách retro thập niên hoàng kim.', 'Quý Tộc', 'from-rose-600/10 via-red-600/5 to-white', 'border-rose-600 ring-2 ring-rose-600/20 bg-rose-50/40', 'bg-rose-100 text-rose-800 border-rose-200', 'Cô Dâu', 'Cổ Điển', TRUE, 5),
('Tùy Biến Theo Yêu Cầu Riêng', 'CUSTOM', 'Bạn đã có sẵn layout yêu thích hoặc ảnh mẫu từ trước? Hãy tải ảnh lên và trao đổi trực tiếp với artist.', 'Khách hàng có concept độc đáo hoặc muốn kết hợp theo gu cá nhân riêng biệt.', 'Linh Hoạt', 'from-purple-500/10 via-indigo-500/5 to-white', 'border-purple-600 ring-2 ring-purple-600/20 bg-purple-50/40', 'bg-purple-100 text-purple-800 border-purple-200', 'Tất cả', '', TRUE, 6)
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- 4. Đồng bộ dữ liệu cũ: Tự động gán layout_id cho các booking hiện có
UPDATE bookings b
JOIN makeup_layouts ml ON b.layout = ml.name OR b.layout LIKE CONCAT('%', ml.code, '%')
SET b.layout_id = ml.id
WHERE b.layout_id IS NULL AND b.layout IS NOT NULL;
