-- V2__seed_initial_data.sql
-- Dữ liệu mẫu hoàn chỉnh: Đảm bảo mỗi bảng có tối thiểu 5 bản ghi hợp lệ và tuân thủ toàn bộ ràng buộc khóa ngoại, duy nhất (UNIQUE), kiểm tra (CHECK)

-- 1. Seed Users (Mật khẩu chuẩn '123456' mã hóa BCrypt - Gồm 1 Admin, 5 Artist phục vụ liên kết 1-1, và 5 Customer)
INSERT INTO users (id, email, password, full_name, phone, avatar, address, role, status) VALUES
(1, 'admin@gmail.com', '$2a$10$XUJznPVIZo/PT3sm/LtSROlmqAeC2rambGUarl95BO1zOALbB1KMy', 'Admin System', '0901234567', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80', '204 Trần Duy Hưng, Cầu Giấy, Hà Nội', 'ROLE_ADMIN', 'ACTIVE'),
(2, 'dung@gmail.com', '$2a$10$XUJznPVIZo/PT3sm/LtSROlmqAeC2rambGUarl95BO1zOALbB1KMy', 'Dung Dorys', '0999999999', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80', '204 Trần Duy Hưng, Cầu Giấy, Hà Nội', 'ROLE_ARTIST', 'ACTIVE'),
(3, 'linh.artist@gmail.com', '$2a$10$XUJznPVIZo/PT3sm/LtSROlmqAeC2rambGUarl95BO1zOALbB1KMy', 'Nguyễn Thùy Linh', '0912345678', 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=400&q=80', 'Quận Đống Đa, Hà Nội', 'ROLE_ARTIST', 'ACTIVE'),
(4, 'maianh.artist@gmail.com', '$2a$10$XUJznPVIZo/PT3sm/LtSROlmqAeC2rambGUarl95BO1zOALbB1KMy', 'Hoàng Mai Anh', '0934567890', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80', 'Quận Hai Bà Trưng, Hà Nội', 'ROLE_ARTIST', 'ACTIVE'),
(5, 'customer@gmail.com', '$2a$10$XUJznPVIZo/PT3sm/LtSROlmqAeC2rambGUarl95BO1zOALbB1KMy', 'Trần Mai Phương', '0987654321', 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80', 'Cầu Giấy, Hà Nội', 'ROLE_CUSTOMER', 'ACTIVE'),
(6, 'quynh.artist@gmail.com', '$2a$10$XUJznPVIZo/PT3sm/LtSROlmqAeC2rambGUarl95BO1zOALbB1KMy', 'Phạm Như Quỳnh', '0945678901', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80', 'Quận Ba Đình, Hà Nội', 'ROLE_ARTIST', 'ACTIVE'),
(7, 'trang.artist@gmail.com', '$2a$10$XUJznPVIZo/PT3sm/LtSROlmqAeC2rambGUarl95BO1zOALbB1KMy', 'Lê Huyền Trang', '0956789012', 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&w=400&q=80', 'Quận Thanh Xuân, Hà Nội', 'ROLE_ARTIST', 'ACTIVE'),
(8, 'lananh.khach@gmail.com', '$2a$10$XUJznPVIZo/PT3sm/LtSROlmqAeC2rambGUarl95BO1zOALbB1KMy', 'Vũ Lan Anh', '0967890123', NULL, 'Quận Hoàn Kiếm, Hà Nội', 'ROLE_CUSTOMER', 'ACTIVE'),
(9, 'minhchau.khach@gmail.com', '$2a$10$XUJznPVIZo/PT3sm/LtSROlmqAeC2rambGUarl95BO1zOALbB1KMy', 'Đỗ Minh Châu', '0978901234', NULL, 'Quận Tây Hồ, Hà Nội', 'ROLE_CUSTOMER', 'ACTIVE'),
(10, 'baongoc.khach@gmail.com', '$2a$10$XUJznPVIZo/PT3sm/LtSROlmqAeC2rambGUarl95BO1zOALbB1KMy', 'Ngô Bảo Ngọc', '0989012345', NULL, 'Quận Nam Từ Liêm, Hà Nội', 'ROLE_CUSTOMER', 'ACTIVE')
ON DUPLICATE KEY UPDATE 
    password = VALUES(password),
    full_name = VALUES(full_name),
    status = VALUES(status);

-- 2. Seed Makeup Artists (5 bản ghi - Liên kết 1-1 với Users có quyền ROLE_ARTIST)
INSERT INTO makeup_artists (id, user_id, experience, specialties, working_hours, working_days, active) VALUES
(1, 2, '6 năm kinh nghiệm', 'Trang điểm cô dâu hoàng gia, dạ tiệc sang trọng, tự nhiên', '08:00 - 20:00', 'Thứ 2 - Chủ Nhật', 1),
(2, 3, '5 năm kinh nghiệm', 'Trang điểm cô dâu, tiệc phong cách Thái Lan, Hàn Quốc', '08:00 - 20:00', 'Thứ 2 - Chủ Nhật', 1),
(3, 4, '4 năm kinh nghiệm', 'Trang điểm tiệc, kỷ yếu, tạo kiểu tóc nhanh hiện đại', '07:00 - 21:00', 'Thứ 2 - Chủ Nhật', 1),
(4, 6, '5 năm kinh nghiệm', 'Trang điểm Douyin trong trẻo, chụp lookbook thời trang', '08:00 - 20:00', 'Thứ 2 - Chủ Nhật', 1),
(5, 7, '7 năm kinh nghiệm', 'Chuyên gia trang điểm cô dâu cao cấp & phục hồi nền da', '07:30 - 20:30', 'Thứ 2 - Chủ Nhật', 1)
ON DUPLICATE KEY UPDATE 
    experience = VALUES(experience),
    specialties = VALUES(specialties),
    active = VALUES(active);

-- 3. Seed Makeup Services (5 bản ghi: 4 dịch vụ đơn lẻ + 1 gói Combo chuẩn 1NF)
INSERT INTO makeup_services (id, service_name, price, duration, description, image, is_combo, active) VALUES
(1, 'Trang điểm Cô dâu Ngày Cưới', 1500000.00, 90, 'Layout cô dâu phong cách sang trọng, bền màu 16h', 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80', 0, 1),
(2, 'Tạo kiểu Tóc Cô dâu Cao cấp', 500000.00, 45, 'Uốn sóng bồng bềnh, búi phong cách hoàng gia đính phụ kiện', 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80', 0, 1),
(3, 'Dán mi 3D Thiết kế & Chăm sóc da', 250000.00, 30, 'Mi chùm siêu nhẹ tự nhiên kèm dưỡng ẩm chống mốc nền', 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=800&q=80', 0, 1),
(4, 'Trang điểm Mẹ Cô dâu / Mẹ Chú rể', 600000.00, 60, 'Phong cách quý phái, nâng tông tự nhiên, che khuyết điểm', 'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?auto=format&fit=crop&w=800&q=80', 0, 1),
(5, 'Combo Cô Dâu Hoàn Hảo (Makeup + Tóc + Mi Thiết Kế)', 1890000.00, 150, 'Gói trọn gói tiết kiệm: Trang điểm cô dâu + Tạo kiểu tóc + Dán mi 3D & dưỡng ẩm chuyên sâu', 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=800&q=80', 1, 1)
ON DUPLICATE KEY UPDATE 
    service_name = VALUES(service_name),
    price = VALUES(price),
    duration = VALUES(duration),
    description = VALUES(description);

-- 4. Seed Service Combo Items (5 bản ghi chi tiết các dịch vụ con trong gói combo)
INSERT INTO service_combo_items (id, combo_service_id, item_service_id, quantity) VALUES
(1, 5, 1, 1),
(2, 5, 2, 1),
(3, 5, 3, 1),
(4, 5, 4, 1),
(5, 5, 2, 2)
ON DUPLICATE KEY UPDATE quantity = VALUES(quantity);

-- 5. Seed Portfolios (5 bản ghi Bộ sưu tập tác phẩm cho thợ trang điểm)
INSERT INTO portfolios (id, makeup_artist_id, title, description, image_url, category_name, tags, view_count) VALUES
(1, 1, 'Cô Dâu Ánh Kim Cương - Diamond Glow', 'Phong cách trang điểm cô dâu hoàng gia sang trọng với lớp nền trong veo căng mọng, nhấn đôi mắt lấp lánh ánh ngọc trai và đôi môi cam đào thời thượng.', 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80', 'Cô Dâu', 'Cô dâu, Hoàng gia, Tone cam đào, Căng bóng', 128),
(2, 1, 'Layout Tiệc Tối Red Velvet Quyến Rũ', 'Tông trang điểm tiệc đêm kinh điển với son đỏ nhung quyền lực, eyeliner mắt mèo sắc lẹm và tạo khối gò má nổi bật cho dạ tiệc sang trọng.', 'https://images.unsplash.com/photo-1526045612212-70caf35c14df?auto=format&fit=crop&w=800&q=80', 'Dự Tiệc', 'Tiệc đêm, Son đỏ, Sang trọng, Quyến rũ', 95),
(3, 2, 'Nàng Thơ Hàn Quốc - Pure Glowy Skin', 'Trang điểm tự nhiên như không makeup (No-makeup makeup), bắt sáng nhẹ nhàng, hàng mi tơi cong tự nhiên thích hợp chụp ảnh kỷ yếu và dạo phố.', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80', 'Kỷ Yếu', 'Hàn Quốc, Trong trẻo, Tự nhiên, Kỷ yếu', 164),
(4, 3, 'Layout Thái Lan Sắc Sảo - Modern Glam', 'Đường nét chân mày phẩy sợi sắc sảo, mắt khói tông đồng ấm áp và son nude căng mọng chuẩn xu hướng makeup Thái Lan.', 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=800&q=80', 'Dự Tiệc', 'Tone Thái, Mắt khói, Chân mày phẩy sợi', 82),
(5, 4, 'Tone Douyin Baby Trong Trẻo - Sweet Peach', 'Đôi mắt to tròn đính nhũ kim tuyến lấp lánh kết hợp má hồng phớt trái đào và son bóng căng mọng ngọt ngào.', 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80', 'Chụp Ảnh', 'Douyin, Baby, Ngọt ngào, Nhũ mắt', 210)
ON DUPLICATE KEY UPDATE 
    title = VALUES(title),
    description = VALUES(description),
    image_url = VALUES(image_url);

-- 6. Seed Artist Schedules (5 bản ghi Lịch làm việc ca mẫu của 5 chuyên viên)
INSERT INTO artist_schedules (id, makeup_artist_id, schedule_date, start_time, end_time, is_day_off) VALUES
(1, 1, '2026-11-05', '08:00:00', '20:00:00', 0),
(2, 2, '2026-11-05', '08:00:00', '20:00:00', 0),
(3, 3, '2026-11-05', '07:00:00', '21:00:00', 0),
(4, 4, '2026-11-06', '08:00:00', '20:00:00', 0),
(5, 5, '2026-11-06', '08:00:00', '18:00:00', 1)
ON DUPLICATE KEY UPDATE is_day_off = VALUES(is_day_off);

-- 7. Seed Bookings (5 bản ghi Đơn đặt lịch mẫu)
INSERT INTO bookings (id, user_id, booking_date, booking_time, target_end_time, location_type, execution_mode, artist_count, dispatch_plan, status, total_price, surcharge, deposit_amount, layout, notes) VALUES
(1, 5, '2026-11-01', '08:00:00', '09:30:00', 'HOME', 'SINGLE', 1, 'SAVING', 'COMPLETED', 1500000.00, 0.00, 450000.00, 'Tone Hàn Quốc / Glass Skin Tự Nhiên', '[ĐÃ THU ĐỦ TIỀN] Khách hàng đặt trang điểm cô dâu tại nhà'),
(2, 5, '2026-11-02', '14:00:00', '15:00:00', 'HOME', 'SINGLE', 1, 'SAVING', 'COMPLETED', 700000.00, 0.00, 210000.00, 'Tone Cổ Điển / Vintage Classic Red', '[ĐÃ THU ĐỦ TIỀN] Trang điểm dự tiệc gia đình'),
(3, 8, '2026-11-03', '09:00:00', '11:30:00', 'HOME', 'SINGLE', 1, 'SAVING', 'COMPLETED', 1990000.00, 0.00, 597000.00, 'Tone Thái Lan / Glowy Sắc Nét', '[ĐÃ THU ĐỦ TIỀN] Combo cô dâu trọn gói tại nhà riêng'),
(4, 9, '2026-11-04', '10:00:00', '11:30:00', 'HOME', 'SINGLE', 1, 'SAVING', 'CONFIRMED', 1600000.00, 0.00, 480000.00, 'Tone Douyin / Baby Trong Trẻo', 'Khách đã thanh toán cọc qua VNPay'),
(5, 10, '2026-11-05', '15:00:00', '16:00:00', 'HOME', 'SINGLE', 1, 'SAVING', 'CONFIRMED', 600000.00, 0.00, 180000.00, 'Tone Tây Nâu / Glamour Sắc Sảo', 'Trang điểm dự gala tối')
ON DUPLICATE KEY UPDATE status = VALUES(status);

-- 8. Seed Booking Addresses (5 bản ghi Địa chỉ làm tại nhà liên kết 1-1 với 5 đơn đặt lịch)
INSERT INTO booking_addresses (id, booking_id, address, distance_km, travel_fee) VALUES
(1, 1, 'Số 88 Phố Huế, Quận Hai Bà Trưng, Hà Nội', 6.50, 0.00),
(2, 2, 'Khu đô thị Vinhomes Smart City, Nam Từ Liêm, Hà Nội', 12.40, 100000.00),
(3, 3, 'Số 154 Nguyễn Văn Cừ, Quận Long Biên, Hà Nội', 14.80, 100000.00),
(4, 4, 'Biệt thự Hoa Sữa 05, Vinhomes Riverside, Long Biên, Hà Nội', 16.20, 100000.00),
(5, 5, 'Tòa R2 Royal City, 72A Nguyễn Trãi, Thanh Xuân, Hà Nội', 4.20, 0.00)
ON DUPLICATE KEY UPDATE address = VALUES(address);

-- 9. Seed Booking Items (5 bản ghi Chi tiết ca dịch vụ trong mỗi đơn)
INSERT INTO booking_items (id, booking_id, makeup_service_id, makeup_artist_id, start_time, end_time, price) VALUES
(1, 1, 1, 1, '08:00:00', '09:30:00', 1500000.00),
(2, 2, 4, 2, '14:00:00', '15:00:00', 600000.00),
(3, 3, 5, 3, '09:00:00', '11:30:00', 1890000.00),
(4, 4, 1, 4, '10:00:00', '11:30:00', 1500000.00),
(5, 5, 4, 5, '15:00:00', '16:00:00', 600000.00)
ON DUPLICATE KEY UPDATE price = VALUES(price);

-- 10. Seed Payments (5 bản ghi Thanh toán cho các đơn đặt lịch)
INSERT INTO payments (id, booking_id, payment_method, transaction_code, amount, status, payment_date) VALUES
(1, 1, 'VNPAY', 'VNP_TXN_20261101_001', 1500000.00, 'PAID', '2026-11-01 07:30:00'),
(2, 2, 'CASH', 'STUDIO_CASH_20261102_002', 700000.00, 'PAID', '2026-11-02 15:05:00'),
(3, 3, 'VNPAY', 'VNP_TXN_20261103_003', 1990000.00, 'PAID', '2026-11-03 08:15:00'),
(4, 4, 'VNPAY', 'VNP_TXN_20261104_004', 480000.00, 'PAID', '2026-11-04 09:00:00'),
(5, 5, 'VNPAY', 'VNP_TXN_20261105_005', 180000.00, 'PAID', '2026-11-05 10:20:00')
ON DUPLICATE KEY UPDATE status = VALUES(status);

-- 11. Seed Reviews (5 bản ghi Đánh giá chất lượng dịch vụ liên kết 1-1 với 5 đơn đặt lịch)
INSERT INTO reviews (id, booking_id, customer_id, artist_id, rating, comment) VALUES
(1, 1, 5, 2, 5, 'Chuyên viên Dung Dorys trang điểm cực kỳ có tâm, lớp nền cô dâu căng bóng giữ suốt cả ngày không hề bị mốc hay xuống tông!'),
(2, 2, 5, 3, 5, 'Chị Thùy Linh làm rất nhẹ tay, mẹ mình khen nức nở vì lớp nền tự nhiên và che khuyết điểm hoàn hảo.'),
(3, 3, 8, 4, 5, 'Gói Combo Cô Dâu quá xứng đáng tiền, từ làm tóc đến gắn mi thiết kế đều tỉ mỉ, đúng giờ.'),
(4, 4, 9, 6, 4, 'Tone Douyin lên hình siêu xinh và bắt sáng tốt, chuyên viên Như Quỳnh nhiệt tình tư vấn layout hợp khuôn mặt.'),
(5, 5, 10, 7, 5, 'Makeup tone Tây dự tiệc tối cực sang, ai cũng hỏi địa chỉ studio. Chắc chắn sẽ quay lại ủng hộ!')
ON DUPLICATE KEY UPDATE rating = VALUES(rating), comment = VALUES(comment);
