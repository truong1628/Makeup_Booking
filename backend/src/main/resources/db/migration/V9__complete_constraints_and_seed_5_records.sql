-- ==============================================================================
-- V9__complete_constraints_and_seed_5_records.sql
-- Bổ sung đầy đủ các ràng buộc toàn vẹn (CHECK, FK, UNIQUE) và chèn đủ tối thiểu 5 bản ghi cho tất cả 16 bảng
-- ==============================================================================
SET NAMES utf8mb4;

-- ------------------------------------------------------------------------------
-- PHẦN 1: BỔ SUNG CÁC RÀNG BUỘC TOÀN VẸN DỮ LIỆU (CHECK CONSTRAINTS)
-- ------------------------------------------------------------------------------
ALTER TABLE users
    ADD CONSTRAINT chk_users_role CHECK (role IN ('ROLE_ADMIN', 'ROLE_ARTIST', 'ROLE_CUSTOMER')),
    ADD CONSTRAINT chk_users_status CHECK (status IN ('ACTIVE', 'INACTIVE', 'BANNED'));

ALTER TABLE service_categories
    ADD CONSTRAINT chk_category_order CHECK (display_order >= 0);

ALTER TABLE makeup_services
    ADD CONSTRAINT chk_service_price CHECK (price >= 0),
    ADD CONSTRAINT chk_service_duration CHECK (duration > 0);

ALTER TABLE service_combo_items
    ADD CONSTRAINT chk_combo_quantity CHECK (quantity > 0),
    ADD CONSTRAINT chk_combo_not_self CHECK (combo_service_id <> item_service_id);

ALTER TABLE makeup_layouts
    ADD CONSTRAINT chk_layout_order CHECK (display_order >= 0);

ALTER TABLE vouchers
    ADD CONSTRAINT chk_voucher_values CHECK (discount_value > 0 AND min_order_amount >= 0 AND used_count >= 0);

ALTER TABLE artist_schedules
    ADD CONSTRAINT chk_schedule_time CHECK (end_time > start_time);

ALTER TABLE bookings
    ADD CONSTRAINT chk_booking_location CHECK (location_type IN ('STUDIO', 'HOME')),
    ADD CONSTRAINT chk_booking_artist_count CHECK (artist_count >= 1),
    ADD CONSTRAINT chk_booking_prices CHECK (total_price >= 0 AND surcharge >= 0 AND deposit_amount >= 0);

ALTER TABLE booking_addresses
    ADD CONSTRAINT chk_baddress_distance_fee CHECK (distance_km >= 0 AND travel_fee >= 0);

ALTER TABLE booking_items
    ADD CONSTRAINT chk_bitem_time CHECK (end_time > start_time),
    ADD CONSTRAINT chk_bitem_price CHECK (price >= 0);

ALTER TABLE reviews
    ADD CONSTRAINT chk_review_rating CHECK (rating BETWEEN 1 AND 5);

ALTER TABLE payments
    ADD CONSTRAINT chk_payment_amount CHECK (amount >= 0);

ALTER TABLE portfolios
    ADD CONSTRAINT chk_portfolio_views CHECK (view_count >= 0);

ALTER TABLE portfolio_images
    ADD CONSTRAINT chk_pimg_order CHECK (display_order >= 0);

-- ------------------------------------------------------------------------------
-- PHẦN 2: CHÈN BỔ SUNG ĐẢM BẢO MỖI BẢNG CÓ TỐI THIỂU 5 BẢN GHI HỢP LỆ
-- ------------------------------------------------------------------------------

-- 1. Bổ sung tài khoản Artist vào bảng `users` để liên kết 1-1 đủ 5 bản ghi cho `makeup_artists`
INSERT INTO users (email, password, full_name, phone, avatar, address, role, status) VALUES
('quynh.artist@gmail.com', '$2a$10$XUJznPVIZo/PT3sm/LtSROlmqAeC2rambGUarl95BO1zOALbB1KMy', 'Phạm Như Quỳnh', '0945678901', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80', 'Quận Ba Đình, Hà Nội', 'ROLE_ARTIST', 'ACTIVE'),
('trang.artist@gmail.com', '$2a$10$XUJznPVIZo/PT3sm/LtSROlmqAeC2rambGUarl95BO1zOALbB1KMy', 'Lê Huyền Trang', '0956789012', 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&w=400&q=80', 'Quận Thanh Xuân, Hà Nội', 'ROLE_ARTIST', 'ACTIVE')
ON DUPLICATE KEY UPDATE
    role = VALUES(role),
    status = VALUES(status);

-- 2. Bổ sung đủ 5 bản ghi cho bảng `makeup_artists` (Ràng buộc UNIQUE user_id)
INSERT INTO makeup_artists (user_id, experience, specialties, working_hours, working_days, active)
SELECT u.id, '5 năm kinh nghiệm', 'Trang điểm Douyin trong trẻo, chụp lookbook thời trang', '08:00 - 20:00', 'Thứ 2 - Chủ Nhật', TRUE
FROM users u
WHERE u.email = 'quynh.artist@gmail.com'
  AND NOT EXISTS (SELECT 1 FROM makeup_artists ma WHERE ma.user_id = u.id);

INSERT INTO makeup_artists (user_id, experience, specialties, working_hours, working_days, active)
SELECT u.id, '7 năm kinh nghiệm', 'Chuyên gia trang điểm cô dâu cao cấp & phục hồi nền da', '07:30 - 20:30', 'Thứ 2 - Chủ Nhật', TRUE
FROM users u
WHERE u.email = 'trang.artist@gmail.com'
  AND NOT EXISTS (SELECT 1 FROM makeup_artists ma WHERE ma.user_id = u.id);

-- 3. Bổ sung đủ 5 bản ghi cho bảng `service_combo_items`
INSERT INTO service_combo_items (combo_service_id, item_service_id, quantity)
SELECT 5, 4, 1 FROM DUAL
WHERE EXISTS (SELECT 1 FROM makeup_services WHERE id = 5)
  AND EXISTS (SELECT 1 FROM makeup_services WHERE id = 4)
  AND (SELECT COUNT(*) FROM service_combo_items) < 4;

INSERT INTO service_combo_items (combo_service_id, item_service_id, quantity)
SELECT 5, 2, 2 FROM DUAL
WHERE EXISTS (SELECT 1 FROM makeup_services WHERE id = 5)
  AND EXISTS (SELECT 1 FROM makeup_services WHERE id = 2)
  AND (SELECT COUNT(*) FROM service_combo_items) < 5;

-- 4. Bổ sung đủ 5 bản ghi cho bảng `user_vouchers` (Ví voucher cá nhân)
INSERT INTO user_vouchers (user_id, voucher_id, is_used, assigned_by, note)
SELECT u.id, v.id, FALSE, 'ADMIN', 'Voucher chào mừng thành viên mới'
FROM users u JOIN vouchers v ON v.code = 'WELCOME10'
WHERE u.email = 'customer@gmail.com'
  AND (SELECT COUNT(*) FROM user_vouchers) < 5;

INSERT INTO user_vouchers (user_id, voucher_id, is_used, assigned_by, note)
SELECT u.id, v.id, FALSE, 'ADMIN', 'Ưu đãi giảm trực tiếp 50K cho khách hàng thân thiết'
FROM users u JOIN vouchers v ON v.code = 'BEAUTY50K'
WHERE u.email = 'customer@gmail.com'
  AND (SELECT COUNT(*) FROM user_vouchers) < 5;

INSERT INTO user_vouchers (user_id, voucher_id, is_used, assigned_by, note)
SELECT u.id, v.id, FALSE, 'ADMIN', 'Quà tặng ưu đãi cô dâu mùa cưới 15%'
FROM users u JOIN vouchers v ON v.code = 'BRIDAL15'
WHERE u.email = 'customer@gmail.com'
  AND (SELECT COUNT(*) FROM user_vouchers) < 5;

INSERT INTO user_vouchers (user_id, voucher_id, is_used, assigned_by, note)
SELECT u.id, v.id, FALSE, 'STUDIO_VIP', 'Đặc quyền hạng Bạc dành tặng khách hàng'
FROM users u JOIN vouchers v ON v.code = 'SILVERSTAR'
WHERE u.email = 'customer@gmail.com'
  AND (SELECT COUNT(*) FROM user_vouchers) < 5;

-- 5. Bổ sung đủ 5 bản ghi cho bảng `artist_schedules` (Lịch làm việc của 5 chuyên viên)
INSERT INTO artist_schedules (makeup_artist_id, schedule_date, start_time, end_time, is_day_off)
SELECT ma.id, '2026-11-10', '08:00:00', '20:00:00', FALSE
FROM (SELECT id FROM makeup_artists ORDER BY id ASC LIMIT 5) ma
WHERE (SELECT COUNT(*) FROM artist_schedules) < 5;

-- 6. Bổ sung đủ 5 bản ghi cho bảng `portfolios` (Bộ sưu tập tác phẩm nghệ thuật)
INSERT INTO portfolios (makeup_artist_id, title, description, image_url, category_name, tags, view_count)
SELECT (SELECT id FROM makeup_artists ORDER BY id ASC LIMIT 1 OFFSET 0),
       'Cô Dâu Ánh Kim Cương - Diamond Glow',
       'Phong cách trang điểm cô dâu hoàng gia sang trọng với lớp nền trong veo căng mọng, nhấn đôi mắt lấp lánh ánh ngọc trai và đôi môi cam đào thời thượng.',
       'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80',
       'Cô Dâu', 'Cô dâu, Hoàng gia, Tone cam đào, Căng bóng', 128
FROM DUAL WHERE (SELECT COUNT(*) FROM portfolios) < 1;

INSERT INTO portfolios (makeup_artist_id, title, description, image_url, category_name, tags, view_count)
SELECT (SELECT id FROM makeup_artists ORDER BY id ASC LIMIT 1 OFFSET 1),
       'Layout Tiệc Tối Red Velvet Quyến Rũ',
       'Tông trang điểm tiệc đêm kinh điển với son đỏ nhung quyền lực, eyeliner mắt mèo sắc lẹm và tạo khối gò má nổi bật cho dạ tiệc sang trọng.',
       'https://images.unsplash.com/photo-1526045612212-70caf35c14df?auto=format&fit=crop&w=800&q=80',
       'Dự Tiệc', 'Tiệc đêm, Son đỏ, Sang trọng, Quyến rũ', 95
FROM DUAL WHERE (SELECT COUNT(*) FROM portfolios) < 2;

INSERT INTO portfolios (makeup_artist_id, title, description, image_url, category_name, tags, view_count)
SELECT (SELECT id FROM makeup_artists ORDER BY id ASC LIMIT 1 OFFSET 2),
       'Nàng Thơ Hàn Quốc - Pure Glowy Skin',
       'Trang điểm tự nhiên như không makeup (No-makeup makeup), bắt sáng nhẹ nhàng, hàng mi tơi cong tự nhiên thích hợp chụp ảnh kỷ yếu và dạo phố.',
       'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
       'Kỷ Yếu', 'Hàn Quốc, Trong trẻo, Tự nhiên, Kỷ yếu', 164
FROM DUAL WHERE (SELECT COUNT(*) FROM portfolios) < 3;

INSERT INTO portfolios (makeup_artist_id, title, description, image_url, category_name, tags, view_count)
SELECT (SELECT id FROM makeup_artists ORDER BY id ASC LIMIT 1 OFFSET 3),
       'Layout Thái Lan Sắc Sảo - Modern Glam',
       'Đường nét chân mày phẩy sợi sắc sảo, mắt khói tông đồng ấm áp và son nude căng mọng chuẩn xu hướng makeup Thái Lan.',
       'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=800&q=80',
       'Dự Tiệc', 'Tone Thái, Mắt khói, Chân mày phẩy sợi', 82
FROM DUAL WHERE (SELECT COUNT(*) FROM portfolios) < 4;

INSERT INTO portfolios (makeup_artist_id, title, description, image_url, category_name, tags, view_count)
SELECT (SELECT id FROM makeup_artists ORDER BY id ASC LIMIT 1 OFFSET 4),
       'Tone Douyin Baby Trong Trẻo - Sweet Peach',
       'Đôi mắt to tròn đính nhũ kim tuyến lấp lánh kết hợp má hồng phớt trái đào và son bóng căng mọng ngọt ngào.',
       'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80',
       'Chụp Ảnh', 'Douyin, Baby, Ngọt ngào, Nhũ mắt', 210
FROM DUAL WHERE (SELECT COUNT(*) FROM portfolios) < 5;

-- 7. Bổ sung đủ 5 bản ghi cho bảng `portfolio_images` (Ảnh chi tiết cho từng bộ sưu tập)
INSERT INTO portfolio_images (portfolio_id, image_url, caption, display_order)
SELECT (SELECT id FROM portfolios ORDER BY id ASC LIMIT 1 OFFSET 0),
       'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80',
       'Góc nghiêng cận cảnh chi tiết mắt nhũ ngọc trai cô dâu', 1
FROM DUAL WHERE (SELECT COUNT(*) FROM portfolio_images) < 1;

INSERT INTO portfolio_images (portfolio_id, image_url, caption, display_order)
SELECT (SELECT id FROM portfolios ORDER BY id ASC LIMIT 1 OFFSET 1),
       'https://images.unsplash.com/photo-1526045612212-70caf35c14df?auto=format&fit=crop&w=800&q=80',
       'Chi tiết son đỏ nhung lì và đường eyeliner mắt mèo sắc sảo', 1
FROM DUAL WHERE (SELECT COUNT(*) FROM portfolio_images) < 2;

INSERT INTO portfolio_images (portfolio_id, image_url, caption, display_order)
SELECT (SELECT id FROM portfolios ORDER BY id ASC LIMIT 1 OFFSET 2),
       'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
       'Lớp nền tự nhiên trong veo chuẩn Glass Skin Hàn Quốc', 1
FROM DUAL WHERE (SELECT COUNT(*) FROM portfolio_images) < 3;

INSERT INTO portfolio_images (portfolio_id, image_url, caption, display_order)
SELECT (SELECT id FROM portfolios ORDER BY id ASC LIMIT 1 OFFSET 3),
       'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=800&q=80',
       'Chi tiết hàng chân mày phẩy sợi và tạo khối tone Thái', 1
FROM DUAL WHERE (SELECT COUNT(*) FROM portfolio_images) < 4;

INSERT INTO portfolio_images (portfolio_id, image_url, caption, display_order)
SELECT (SELECT id FROM portfolios ORDER BY id ASC LIMIT 1 OFFSET 4),
       'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80',
       'Góc chính diện layout Douyin má hồng cam đào ngọt ngào', 1
FROM DUAL WHERE (SELECT COUNT(*) FROM portfolio_images) < 5;

-- 8. Bổ sung đủ 5 bản ghi cho bảng `reviews` (Đánh giá dịch vụ liên kết 1-1 với `bookings`)
INSERT INTO reviews (booking_id, customer_id, artist_id, rating, comment)
SELECT b.id, b.user_id,
       COALESCE((SELECT ma.user_id FROM booking_items bi JOIN makeup_artists ma ON bi.makeup_artist_id = ma.id WHERE bi.booking_id = b.id LIMIT 1),
                (SELECT user_id FROM makeup_artists ORDER BY id ASC LIMIT 1)),
       5, 'Chuyên viên trang điểm cực kỳ có tâm, lớp nền cô dâu căng bóng giữ suốt cả ngày không hề bị mốc hay xuống tông!'
FROM (SELECT id, user_id FROM bookings ORDER BY id ASC LIMIT 1 OFFSET 0) b
WHERE NOT EXISTS (SELECT 1 FROM reviews r WHERE r.booking_id = b.id);

INSERT INTO reviews (booking_id, customer_id, artist_id, rating, comment)
SELECT b.id, b.user_id,
       COALESCE((SELECT ma.user_id FROM booking_items bi JOIN makeup_artists ma ON bi.makeup_artist_id = ma.id WHERE bi.booking_id = b.id LIMIT 1),
                (SELECT user_id FROM makeup_artists ORDER BY id ASC LIMIT 1)),
       5, 'Chuyên viên làm rất nhẹ tay, gia đình mình khen nức nở vì lớp nền tự nhiên và che khuyết điểm hoàn hảo.'
FROM (SELECT id, user_id FROM bookings ORDER BY id ASC LIMIT 1 OFFSET 1) b
WHERE NOT EXISTS (SELECT 1 FROM reviews r WHERE r.booking_id = b.id);

INSERT INTO reviews (booking_id, customer_id, artist_id, rating, comment)
SELECT b.id, b.user_id,
       COALESCE((SELECT ma.user_id FROM booking_items bi JOIN makeup_artists ma ON bi.makeup_artist_id = ma.id WHERE bi.booking_id = b.id LIMIT 1),
                (SELECT user_id FROM makeup_artists ORDER BY id ASC LIMIT 1)),
       5, 'Dịch vụ rất xứng đáng tiền, từ làm tóc đến gắn mi thiết kế đều tỉ mỉ và đúng giờ hẹn.'
FROM (SELECT id, user_id FROM bookings ORDER BY id ASC LIMIT 1 OFFSET 2) b
WHERE NOT EXISTS (SELECT 1 FROM reviews r WHERE r.booking_id = b.id);

INSERT INTO reviews (booking_id, customer_id, artist_id, rating, comment)
SELECT b.id, b.user_id,
       COALESCE((SELECT ma.user_id FROM booking_items bi JOIN makeup_artists ma ON bi.makeup_artist_id = ma.id WHERE bi.booking_id = b.id LIMIT 1),
                (SELECT user_id FROM makeup_artists ORDER BY id ASC LIMIT 1)),
       4, 'Layout lên hình siêu xinh và bắt sáng tốt, chuyên viên nhiệt tình tư vấn phong cách hợp khuôn mặt.'
FROM (SELECT id, user_id FROM bookings ORDER BY id ASC LIMIT 1 OFFSET 3) b
WHERE NOT EXISTS (SELECT 1 FROM reviews r WHERE r.booking_id = b.id);

INSERT INTO reviews (booking_id, customer_id, artist_id, rating, comment)
SELECT b.id, b.user_id,
       COALESCE((SELECT ma.user_id FROM booking_items bi JOIN makeup_artists ma ON bi.makeup_artist_id = ma.id WHERE bi.booking_id = b.id LIMIT 1),
                (SELECT user_id FROM makeup_artists ORDER BY id ASC LIMIT 1)),
       5, 'Makeup dự tiệc cực sang, mỹ phẩm cao cấp thơm dịu. Chắc chắn sẽ quay lại ủng hộ Studio!'
FROM (SELECT id, user_id FROM bookings ORDER BY id ASC LIMIT 1 OFFSET 4) b
WHERE NOT EXISTS (SELECT 1 FROM reviews r WHERE r.booking_id = b.id);

