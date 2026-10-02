-- V2__seed_initial_data.sql
-- Dữ liệu mẫu hoàn chỉnh: Users, Artists, Services, Combos, Portfolios, Schedules và Bookings

-- 1. Seed Users (Mật khẩu chuẩn '123456' mã hóa BCrypt cho toàn bộ tài khoản mẫu)
-- Hash BCrypt cho '123456': $2a$10$XUJznPVIZo/PT3sm/LtSROlmqAeC2rambGUarl95BO1zOALbB1KMy
INSERT INTO users (id, email, password, full_name, phone, avatar, address, role, status) VALUES
(1, 'admin@gmail.com', '$2a$10$XUJznPVIZo/PT3sm/LtSROlmqAeC2rambGUarl95BO1zOALbB1KMy', 'Admin System', '0901234567', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb', 'Hà Nội', 'ROLE_ADMIN', 'ACTIVE'),
(2, 'dung@gmail.com', '$2a$10$XUJznPVIZo/PT3sm/LtSROlmqAeC2rambGUarl95BO1zOALbB1KMy', 'Dung Dorys', '0999999999', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb', '204 Trần Duy Hưng, Cầu Giấy, Hà Nội', 'ROLE_ARTIST', 'ACTIVE'),
(3, 'linh.artist@gmail.com', '$2a$10$XUJznPVIZo/PT3sm/LtSROlmqAeC2rambGUarl95BO1zOALbB1KMy', 'Nguyễn Thùy Linh', '0912345678', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2', 'Quận 1, TP. Hồ Chí Minh', 'ROLE_ARTIST', 'ACTIVE'),
(4, 'maianh.artist@gmail.com', '$2a$10$XUJznPVIZo/PT3sm/LtSROlmqAeC2rambGUarl95BO1zOALbB1KMy', 'Hoàng Mai Anh', '0934567890', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2', 'Hà Nội', 'ROLE_ARTIST', 'ACTIVE'),
(5, 'customer@gmail.com', '$2a$10$XUJznPVIZo/PT3sm/LtSROlmqAeC2rambGUarl95BO1zOALbB1KMy', 'Trần Mai Phương', '0987654321', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330', 'Cầu Giấy, Hà Nội', 'ROLE_CUSTOMER', 'ACTIVE')
ON DUPLICATE KEY UPDATE 
    password = VALUES(password),
    full_name = VALUES(full_name),
    status = VALUES(status);

-- 2. Seed Makeup Artists (Liên kết 1-1 với Users có quyền ROLE_ARTIST)
INSERT INTO makeup_artists (id, user_id, experience, specialties, working_hours, working_days, active) VALUES
(1, 2, '5 năm kinh nghiệm', 'Trang điểm cô dâu, dạ tiệc sang trọng, tự nhiên', '08:00 - 20:00', 'Thứ 2 - Chủ Nhật', 1),
(2, 3, '5 năm kinh nghiệm', 'Trang điểm cô dâu, tiệc phong cách Thái, Hàn', '08:00 - 20:00', 'Thứ 2 - Chủ Nhật', 1),
(3, 4, '4 năm kinh nghiệm', 'Trang điểm tiệc, kỷ yếu, tạo kiểu tóc nhanh hiện đại', '07:00 - 21:00', 'Thứ 2 - Chủ Nhật', 1)
ON DUPLICATE KEY UPDATE 
    experience = VALUES(experience),
    specialties = VALUES(specialties),
    active = VALUES(active);

-- 3. Seed Makeup Services (4 dịch vụ đơn lẻ + 1 gói Combo chuẩn 1NF)
INSERT INTO makeup_services (id, service_name, price, duration, description, image, is_combo, active) VALUES
(1, 'Trang điểm Cô dâu Ngày Cưới', 1500000.00, 90, 'Layout cô dâu phong cách sang trọng, bền màu 16h', 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f', 0, 1),
(2, 'Tạo kiểu Tóc Cô dâu Cao cấp', 500000.00, 45, 'Uốn sóng bồng bềnh, búi phong cách hoàng gia đính phụ kiện', 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e', 0, 1),
(3, 'Dán mi 3D Thiết kế & Chăm sóc da', 250000.00, 30, 'Mi chùm siêu nhẹ tự nhiên kèm dưỡng ẩm chống mốc nền', 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796', 0, 1),
(4, 'Trang điểm Mẹ Cô dâu / Mẹ Chú rể', 600000.00, 60, 'Phong cách quý phái, nâng tông tự nhiên, che khuyết điểm', 'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937', 0, 1),
(5, 'Combo Cô Dâu Hoàn Hảo (Makeup + Tóc + Mi Thiết Kế)', 1890000.00, 150, 'Gói trọn gói tiết kiệm: Trang điểm cô dâu + Tạo kiểu tóc + Dán mi 3D & dưỡng ẩm chuyên sâu', 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e', 1, 1)
ON DUPLICATE KEY UPDATE 
    service_name = VALUES(service_name),
    price = VALUES(price),
    duration = VALUES(duration),
    description = VALUES(description);

-- 4. Seed Service Combo Items (Chi tiết các món trong gói combo ID = 5)
INSERT INTO service_combo_items (id, combo_service_id, item_service_id, quantity) VALUES
(1, 5, 1, 1),
(2, 5, 2, 1),
(3, 5, 3, 1)
ON DUPLICATE KEY UPDATE quantity = VALUES(quantity);

-- 5. Seed Portfolios (Bộ sưu tập layout tác phẩm cho thợ trang điểm)
INSERT INTO portfolios (id, makeup_artist_id, title, description, image_url, category_name, tags, view_count) VALUES
(1, 1, 'Cô Dâu Ánh Kim Cương - Diamond Glow', 'Phong cách trang điểm cô dâu hoàng gia sang trọng với lớp nền trong veo căng mọng, nhấn đôi mắt lấp lánh ánh ngọc trai và đôi môi cam đào thời thượng.', 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f', 'Cô Dâu', 'Cô dâu, Hoàng gia, Tone cam đào, Căng bóng', 128),
(2, 1, 'Layout Tiệc Tối Red Velvet Quyến Rũ', 'Tông trang điểm tiệc đêm kinh điển với son đỏ nhung quyền lực, eyeliner mắt mèo sắc lẹm và tạo khối gò má nổi bật cho dạ tiệc sang trọng.', 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e', 'Dự Tiệc', 'Tiệc đêm, Son đỏ, Sang trọng, Quyến rũ', 95),
(3, 2, 'Nàng Thơ Hàn Quốc - Pure Glowy Skin', 'Trang điểm tự nhiên như không makeup (No-makeup makeup), bắt sáng nhẹ nhàng, hàng mi tơi cong tự nhiên thích hợp chụp ảnh kỷ yếu và dạo phố.', 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796', 'Kỷ Yếu', 'Hàn Quốc, Trong trẻo, Tự nhiên, Kỷ yếu', 164),
(4, 2, 'Layout Thái Lan Sắc Sảo - Modern Glam', 'Đường nét chân mày phẩy sợi sắc sảo, mắt khói tông đồng ấm áp và son nude căng mọng chuẩn xu hướng makeup Thái Lan.', 'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937', 'Dự Tiệc', 'Tone Thái, Mắt khói, Chân mày phẩy sợi', 82)
ON DUPLICATE KEY UPDATE 
    title = VALUES(title),
    description = VALUES(description);

-- 6. Seed Artist Schedules (Lịch làm việc ca mẫu)
INSERT INTO artist_schedules (id, makeup_artist_id, schedule_date, start_time, end_time, is_day_off) VALUES
(1, 1, '2026-10-01', '08:00:00', '20:00:00', 0),
(2, 2, '2026-10-01', '08:00:00', '20:00:00', 1),
(3, 3, '2026-10-01', '07:00:00', '21:00:00', 0)
ON DUPLICATE KEY UPDATE is_day_off = VALUES(is_day_off);

-- 7. Seed Test Bookings & Booking Items (Dữ liệu đơn đặt lịch mẫu để kiểm thử)
INSERT INTO bookings (id, user_id, booking_date, booking_time, target_end_time, location_type, execution_mode, artist_count, dispatch_plan, status, total_price, surcharge, deposit_amount) VALUES
(1, 5, '2026-10-01', '09:00:00', '10:30:00', 'STUDIO', 'SINGLE', 1, 'SAVING', 'CONFIRMED', 1500000.00, 0.00, 450000.00),
(2, 5, '2026-10-01', '14:00:00', '15:00:00', 'STUDIO', 'SINGLE', 1, 'SAVING', 'CONFIRMED', 600000.00, 0.00, 180000.00)
ON DUPLICATE KEY UPDATE status = VALUES(status);

INSERT INTO booking_items (id, booking_id, makeup_service_id, makeup_artist_id, start_time, end_time, price) VALUES
(1, 1, 1, 1, '09:00:00', '10:30:00', 1500000.00),
(2, 2, 4, 1, '14:00:00', '15:00:00', 600000.00)
ON DUPLICATE KEY UPDATE price = VALUES(price);
