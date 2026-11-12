-- V2__seed_initial_data.sql
-- Dữ liệu mẫu hợp nhất đầy đủ cho 16 bảng (mật khẩu mặc định '123456' mã hóa BCrypt)
SET NAMES utf8mb4;

-- 1. Seed Users (1 Admin, 5 Artist, 4 Customer)
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

-- 2. Seed Makeup Artists (Giờ nhận lịch mặc định 'Cả ngày')
INSERT INTO makeup_artists (id, user_id, experience, specialties, working_hours, working_days, active) VALUES
(1, 2, '6 năm kinh nghiệm', 'Trang điểm cô dâu hoàng gia, dạ tiệc sang trọng, tự nhiên', 'Cả ngày', 'Thứ 2 - Chủ Nhật', 1),
(2, 3, '5 năm kinh nghiệm', 'Trang điểm cô dâu, tiệc phong cách Thái Lan, Hàn Quốc', 'Cả ngày', 'Thứ 2 - Chủ Nhật', 1),
(3, 4, '4 năm kinh nghiệm', 'Trang điểm tiệc, kỷ yếu, tạo kiểu tóc nhanh hiện đại', 'Cả ngày', 'Thứ 2 - Chủ Nhật', 1),
(4, 6, '5 năm kinh nghiệm', 'Trang điểm Douyin trong trẻo, chụp lookbook thời trang', 'Cả ngày', 'Thứ 2 - Chủ Nhật', 1),
(5, 7, '7 năm kinh nghiệm', 'Chuyên gia trang điểm cô dâu cao cấp & phục hồi nền da', 'Cả ngày', 'Thứ 2 - Chủ Nhật', 1)
ON DUPLICATE KEY UPDATE
    experience = VALUES(experience),
    specialties = VALUES(specialties),
    working_hours = VALUES(working_hours),
    active = VALUES(active);

-- 3. Seed Service Categories (6 danh mục chuẩn)
INSERT INTO service_categories (id, name, code, icon, description, display_order, active) VALUES
(1, 'Trang Điểm Cô Dâu', 'BRIDAL', 'Heart', 'Trang điểm cô dâu ngày cưới, lễ ăn hỏi, đón dâu sang trọng, lộng lẫy và bền màu suốt cả ngày dài.', 1, TRUE),
(2, 'Dự Tiệc & Sự Kiện', 'PARTY', 'Sparkles', 'Trang điểm dạ tiệc, gala dinner, lễ trao giải, phong cách nổi bật cuốn hút dưới ánh đèn sân khấu.', 2, TRUE),
(3, 'Chụp Ảnh & Profile', 'PHOTO', 'Camera', 'Trang điểm chụp kỷ yếu, lookbook thời trang, ảnh thẻ nghệ thuật và chân dung doanh nhân.', 3, TRUE),
(4, 'Tự Nhiên Hàng Ngày', 'NATURAL', 'Flower2', 'Phong cách trang điểm nhẹ nhàng, trong veo chuẩn phong cách Hàn Quốc cho sinh hoạt và dạo phố.', 4, TRUE),
(5, 'Làm Tóc & Phụ Kiện', 'HAIR', 'Scissors', 'Tạo kiểu tóc cô dâu, tóc dạ tiệc bồng bềnh kết hợp hoa tươi và phụ kiện cài tóc cao cấp.', 5, TRUE),
(6, 'Gói Combo Trọn Gói', 'COMBO', 'Layers', 'Gói dịch vụ kết hợp trang điểm kèm làm tóc và phụ kiện trọn gói, tiết kiệm tối ưu chi phí.', 6, TRUE)
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- 4. Seed Makeup Services (4 dịch vụ đơn lẻ + 1 gói Combo)
INSERT INTO makeup_services (id, category_id, service_name, price, duration, description, image, is_combo, active) VALUES
(1, 1, 'Trang điểm Cô dâu Ngày Cưới', 1500000.00, 90, 'Layout cô dâu phong cách sang trọng, bền màu 16h', 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80', 0, 1),
(2, 5, 'Tạo kiểu Tóc Cô dâu Cao cấp', 500000.00, 45, 'Uốn sóng bồng bềnh, búi phong cách hoàng gia đính phụ kiện', 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80', 0, 1),
(3, 1, 'Dán mi 3D Thiết kế & Chăm sóc da', 250000.00, 30, 'Mi chùm siêu nhẹ tự nhiên kèm dưỡng ẩm chống mốc nền', 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=800&q=80', 0, 1),
(4, 2, 'Trang điểm Mẹ Cô dâu / Mẹ Chú rể', 600000.00, 60, 'Phong cách quý phái, nâng tông tự nhiên, che khuyết điểm', 'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?auto=format&fit=crop&w=800&q=80', 0, 1),
(5, 6, 'Combo Cô Dâu Hoàn Hảo (Makeup + Tóc + Mi Thiết Kế)', 1890000.00, 150, 'Gói trọn gói tiết kiệm: Trang điểm cô dâu + Tạo kiểu tóc + Dán mi 3D & dưỡng ẩm chuyên sâu', 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=800&q=80', 1, 1)
ON DUPLICATE KEY UPDATE
    category_id = VALUES(category_id),
    service_name = VALUES(service_name),
    price = VALUES(price),
    duration = VALUES(duration),
    description = VALUES(description);

-- 5. Seed Service Combo Items (5 bản ghi)
INSERT INTO service_combo_items (id, combo_service_id, item_service_id, quantity) VALUES
(1, 5, 1, 1),
(2, 5, 2, 1),
(3, 5, 3, 1),
(4, 5, 4, 1),
(5, 5, 2, 2)
ON DUPLICATE KEY UPDATE quantity = VALUES(quantity);

-- 6. Seed Makeup Layouts (6 phong cách chuẩn)
INSERT INTO makeup_layouts (id, name, code, description, suitable_for, tag, gradient, border_active, badge_class, category, search_keyword, active, display_order) VALUES
(1, 'Tone Douyin / Baby Trong Trẻo', 'DOUYIN', 'Mắt long lanh nhũ bắt sáng, má hồng baby phớt cam đào, môi mọng juicy trong veo ngây thơ.', 'Mặt tròn, trái xoan, chụp ảnh kỷ yếu, tiệc trẻ trung, sự kiện ngoài trời.', 'Hot Trend', 'from-pink-500/10 via-rose-500/5 to-white', 'border-pink-500 ring-2 ring-pink-500/20 bg-pink-50/40', 'bg-pink-100 text-pink-700 border-pink-200', 'Dự Tiệc', 'Douyin', TRUE, 1),
(2, 'Tone Hàn Quốc / Glass Skin Tự Nhiên', 'KOREAN', 'Lớp nền mỏng nhẹ căng bóng dewy, chân mày phẩy sợi nhẹ nhàng, tone cam đào hoặc san hô chuẩn Hàn.', 'Phù hợp mọi khuôn mặt, đi tiệc nhẹ, sự kiện ban ngày, cô dâu lễ ăn hỏi.', 'Thanh Lịch', 'from-amber-500/10 via-orange-500/5 to-white', 'border-amber-500 ring-2 ring-amber-500/20 bg-amber-50/40', 'bg-amber-100 text-amber-800 border-amber-200', 'Hàn Quốc', 'Hàn Quốc', TRUE, 2),
(3, 'Tone Tây Nâu / Glamour Sắc Sảo', 'WESTERN', 'Tạo khối gò má góc cạnh, mắt khói nâu cut-crease hút hồn, son nude đất lì sắc sảo sang trọng.', 'Khuôn mặt góc cạnh, tiệc tối gala, chụp lookbook thời trang, dạ hội cao cấp.', 'Quyến Rũ', 'from-stone-500/10 via-amber-700/5 to-white', 'border-stone-600 ring-2 ring-stone-600/20 bg-stone-50/50', 'bg-stone-200 text-stone-800 border-stone-300', 'Thời Trang', 'Tây', TRUE, 3),
(4, 'Tone Thái Lan / Glowy Sắc Nét', 'THAI', 'Lông mày cong sắc nét, mi cong vút tơi đều, tone cam đất ấm áp tạo chiều sâu hút mọi ánh nhìn.', 'Mặt dài, mặt vuông, nước da ngăm khỏe khoắn hoặc bánh mật tôn nét.', 'Ấn Tượng', 'from-orange-500/10 via-rose-500/5 to-white', 'border-orange-500 ring-2 ring-orange-500/20 bg-orange-50/40', 'bg-orange-100 text-orange-800 border-orange-200', 'Tone Thái', 'Thái', TRUE, 4),
(5, 'Tone Cổ Điển / Vintage Classic Red', 'VINTAGE', 'Eyeliner mắt mèo sắc lẹm, làn da sứ mịn như nhung, màu son đỏ thuần quyền lực phong cách minh tinh.', 'Tiệc cưới sang trọng, dạ tiệc đêm, phong cách retro thập niên hoàng kim.', 'Quý Tộc', 'from-rose-600/10 via-red-600/5 to-white', 'border-rose-600 ring-2 ring-rose-600/20 bg-rose-50/40', 'bg-rose-100 text-rose-800 border-rose-200', 'Cô Dâu', 'Cổ Điển', TRUE, 5),
(6, 'Tùy Biến Theo Yêu Cầu Riêng', 'CUSTOM', 'Bạn đã có sẵn layout yêu thích hoặc ảnh mẫu từ trước? Hãy tải ảnh lên và trao đổi trực tiếp với artist.', 'Khách hàng có concept độc đáo hoặc muốn kết hợp theo gu cá nhân riêng biệt.', 'Linh Hoạt', 'from-purple-500/10 via-indigo-500/5 to-white', 'border-purple-600 ring-2 ring-purple-600/20 bg-purple-50/40', 'bg-purple-100 text-purple-800 border-purple-200', 'Tất cả', '', TRUE, 6)
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- 7. Seed Vouchers (7 mã khuyến mãi công khai theo hạng & cá nhân)
INSERT INTO vouchers (code, name, description, discount_type, discount_value, max_discount_amount, min_order_amount, start_date, end_date, usage_limit, used_count, user_usage_limit, target_tier, voucher_scope, active) VALUES
('WELCOME10', 'Giảm 10% Chào Mừng Khách Hàng Mới', 'Áp dụng cho mọi khách hàng đặt lịch trải nghiệm lần đầu tại hệ thống.', 'PERCENTAGE', 10.00, 100000.00, 200000.00, NOW() - INTERVAL 1 DAY, NOW() + INTERVAL 90 DAY, 500, 12, 1, 'NEW', 'PUBLIC', TRUE),
('BEAUTY50K', 'Giảm Trực Tiếp 50.000đ', 'Tặng ngay 50.000đ cho đơn đặt dịch vụ từ 400.000đ trở lên.', 'FIXED_AMOUNT', 50000.00, 50000.00, 400000.00, NOW() - INTERVAL 1 DAY, NOW() + INTERVAL 60 DAY, 200, 35, 1, 'ALL', 'PUBLIC', TRUE),
('BRIDAL15', 'Ưu Đãi Cô Dâu Hạnh Phúc 15%', 'Dành riêng cho các gói dịch vụ trang điểm cô dâu ngày cưới hoặc lễ ăn hỏi.', 'PERCENTAGE', 15.00, 300000.00, 1000000.00, NOW() - INTERVAL 1 DAY, NOW() + INTERVAL 120 DAY, 100, 8, 2, 'ALL', 'PUBLIC', TRUE),
('VIP2024', 'Tri Ân Khách Hàng VIP 20%', 'Khuyến mãi đặc biệt 20% (tối đa 200.000đ) khi đặt lịch nhóm từ 500.000đ.', 'PERCENTAGE', 20.00, 200000.00, 500000.00, NOW() - INTERVAL 1 DAY, NOW() + INTERVAL 180 DAY, 50, 19, 1, 'VIP', 'PUBLIC', TRUE),
('MYGIFT100K', 'Quà Tặng Sinh Nhật 100.000đ', 'Voucher đặc quyền dành riêng trong ví của bạn nhân dịp đặc biệt.', 'FIXED_AMOUNT', 100000.00, 100000.00, 300000.00, NOW() - INTERVAL 1 DAY, NOW() + INTERVAL 90 DAY, 10, 0, 1, 'ALL', 'PERSONAL', TRUE),
('SILVERSTAR', 'Ưu Đãi Đặc Quyền Hạng Bạc 12%', 'Dành riêng cho khách hàng đạt cấp bậc Bạc (Silver).', 'PERCENTAGE', 12.00, 150000.00, 350000.00, NOW() - INTERVAL 1 DAY, NOW() + INTERVAL 90 DAY, 200, 5, 2, 'SILVER', 'PUBLIC', TRUE),
('GOLDENLADY', 'Đặc Quyền Nàng Thơ Vàng 18%', 'Dành riêng cho khách hàng VIP hạng Vàng (Gold) thân thiết.', 'PERCENTAGE', 18.00, 250000.00, 450000.00, NOW() - INTERVAL 1 DAY, NOW() + INTERVAL 90 DAY, 100, 3, 2, 'GOLD', 'PUBLIC', TRUE)
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- 8. Seed User Vouchers (5 bản ghi trong ví khách hàng mẫu)
INSERT INTO user_vouchers (user_id, voucher_id, is_used, assigned_by, note)
SELECT 5, v.id, FALSE, 'STUDIO_VIP', 'Quà tặng chào mừng vào ví cá nhân DungDorys' FROM vouchers v WHERE v.code = 'MYGIFT100K'
UNION ALL
SELECT 5, v.id, FALSE, 'ADMIN', 'Voucher chào mừng thành viên mới' FROM vouchers v WHERE v.code = 'WELCOME10'
UNION ALL
SELECT 5, v.id, FALSE, 'ADMIN', 'Ưu đãi giảm trực tiếp 50K cho khách hàng thân thiết' FROM vouchers v WHERE v.code = 'BEAUTY50K'
UNION ALL
SELECT 5, v.id, FALSE, 'ADMIN', 'Quà tặng ưu đãi cô dâu mùa cưới 15%' FROM vouchers v WHERE v.code = 'BRIDAL15'
UNION ALL
SELECT 5, v.id, FALSE, 'STUDIO_VIP', 'Đặc quyền hạng Bạc dành tặng khách hàng' FROM vouchers v WHERE v.code = 'SILVERSTAR';

-- 9. Seed Portfolios (5 tác phẩm)
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

-- 10. Seed Portfolio Images (6 ảnh chi tiết)
INSERT INTO portfolio_images (id, portfolio_id, image_url, caption, display_order) VALUES
(1, 1, 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80', 'Góc nghiêng cận cảnh chi tiết mắt nhũ ngọc trai', 1),
(2, 1, 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80', 'Góc chính diện lớp nền căng bóng mọng nước', 2),
(3, 2, 'https://images.unsplash.com/photo-1526045612212-70caf35c14df?auto=format&fit=crop&w=800&q=80', 'Chi tiết son đỏ nhung lì và đường eyeliner mắt mèo', 1),
(4, 2, 'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?auto=format&fit=crop&w=800&q=80', 'Tổng thể layout dưới ánh sáng dạ tiệc đêm', 2),
(5, 3, 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80', 'Lớp nền tự nhiên trong veo và má hồng cam đào nhẹ nhàng', 1),
(6, 4, 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=800&q=80', 'Chi tiết hàng chân mày phẩy sợi và son tone đất', 1)
ON DUPLICATE KEY UPDATE caption = VALUES(caption);

-- 11. Seed Artist Schedules (Ca làm việc cả ngày 00:00:00 - 23:59:59)
INSERT INTO artist_schedules (id, makeup_artist_id, schedule_date, start_time, end_time, is_day_off) VALUES
(1, 1, '2026-11-05', '00:00:00', '23:59:59', 0),
(2, 2, '2026-11-05', '00:00:00', '23:59:59', 0),
(3, 3, '2026-11-05', '00:00:00', '23:59:59', 0),
(4, 4, '2026-11-06', '00:00:00', '23:59:59', 0),
(5, 5, '2026-11-06', '08:00:00', '18:00:00', 1)
ON DUPLICATE KEY UPDATE start_time = VALUES(start_time), end_time = VALUES(end_time), is_day_off = VALUES(is_day_off);

-- 12. Seed Bookings (5 đơn mẫu kèm layout_id)
INSERT INTO bookings (id, user_id, booking_date, booking_time, target_end_time, location_type, execution_mode, artist_count, dispatch_plan, status, total_price, surcharge, deposit_amount, layout_id, layout, notes) VALUES
(1, 5, '2026-11-01', '08:00:00', '09:30:00', 'HOME', 'SINGLE', 1, 'SAVING', 'COMPLETED', 1500000.00, 0.00, 450000.00, 2, 'Tone Hàn Quốc / Glass Skin Tự Nhiên', '[ĐÃ THU ĐỦ TIỀN] Khách hàng đặt trang điểm cô dâu tại nhà'),
(2, 5, '2026-11-02', '14:00:00', '15:00:00', 'HOME', 'SINGLE', 1, 'SAVING', 'COMPLETED', 700000.00, 0.00, 210000.00, 5, 'Tone Cổ Điển / Vintage Classic Red', '[ĐÃ THU ĐỦ TIỀN] Trang điểm dự tiệc gia đình'),
(3, 8, '2026-11-03', '09:00:00', '11:30:00', 'HOME', 'SINGLE', 1, 'SAVING', 'COMPLETED', 1990000.00, 0.00, 597000.00, 4, 'Tone Thái Lan / Glowy Sắc Nét', '[ĐÃ THU ĐỦ TIỀN] Combo cô dâu trọn gói tại nhà riêng'),
(4, 9, '2026-11-04', '10:00:00', '11:30:00', 'HOME', 'SINGLE', 1, 'SAVING', 'CONFIRMED', 1600000.00, 0.00, 480000.00, 1, 'Tone Douyin / Baby Trong Trẻo', 'Khách đã thanh toán cọc qua VNPay'),
(5, 10, '2026-11-05', '15:00:00', '16:00:00', 'HOME', 'SINGLE', 1, 'SAVING', 'CONFIRMED', 600000.00, 0.00, 180000.00, 3, 'Tone Tây Nâu / Glamour Sắc Sảo', 'Trang điểm dự gala tối')
ON DUPLICATE KEY UPDATE status = VALUES(status);

-- 13. Seed Booking Addresses
INSERT INTO booking_addresses (id, booking_id, address, distance_km, travel_fee) VALUES
(1, 1, 'Số 88 Phố Huế, Quận Hai Bà Trưng, Hà Nội', 6.50, 0.00),
(2, 2, 'Khu đô thị Vinhomes Smart City, Nam Từ Liêm, Hà Nội', 12.40, 100000.00),
(3, 3, 'Số 154 Nguyễn Văn Cừ, Quận Long Biên, Hà Nội', 14.80, 100000.00),
(4, 4, 'Biệt thự Hoa Sữa 05, Vinhomes Riverside, Long Biên, Hà Nội', 16.20, 100000.00),
(5, 5, 'Tòa R2 Royal City, 72A Nguyễn Trãi, Thanh Xuân, Hà Nội', 4.20, 0.00)
ON DUPLICATE KEY UPDATE address = VALUES(address);

-- 14. Seed Booking Items
INSERT INTO booking_items (id, booking_id, makeup_service_id, makeup_artist_id, start_time, end_time, price) VALUES
(1, 1, 1, 1, '08:00:00', '09:30:00', 1500000.00),
(2, 2, 4, 2, '14:00:00', '15:00:00', 600000.00),
(3, 3, 5, 3, '09:00:00', '11:30:00', 1890000.00),
(4, 4, 1, 4, '10:00:00', '11:30:00', 1500000.00),
(5, 5, 4, 5, '15:00:00', '16:00:00', 600000.00)
ON DUPLICATE KEY UPDATE price = VALUES(price);

-- 15. Seed Payments
INSERT INTO payments (id, booking_id, payment_method, transaction_code, amount, status, payment_date) VALUES
(1, 1, 'VNPAY', 'VNP_TXN_20261101_001', 1500000.00, 'PAID', '2026-11-01 07:30:00'),
(2, 2, 'CASH', 'STUDIO_CASH_20261102_002', 700000.00, 'PAID', '2026-11-02 15:05:00'),
(3, 3, 'VNPAY', 'VNP_TXN_20261103_003', 1990000.00, 'PAID', '2026-11-03 08:15:00'),
(4, 4, 'VNPAY', 'VNP_TXN_20261104_004', 480000.00, 'PAID', '2026-11-04 09:00:00'),
(5, 5, 'VNPAY', 'VNP_TXN_20261105_005', 180000.00, 'PAID', '2026-11-05 10:20:00')
ON DUPLICATE KEY UPDATE status = VALUES(status);

-- 16. Seed Reviews
INSERT INTO reviews (id, booking_id, customer_id, artist_id, rating, comment) VALUES
(1, 1, 5, 2, 5, 'Chuyên viên Dung Dorys trang điểm cực kỳ có tâm, lớp nền cô dâu căng bóng giữ suốt cả ngày không hề bị mốc hay xuống tông!'),
(2, 2, 5, 3, 5, 'Chị Thùy Linh làm rất nhẹ tay, mẹ mình khen nức nở vì lớp nền tự nhiên và che khuyết điểm hoàn hảo.'),
(3, 3, 8, 4, 5, 'Gói Combo Cô Dâu quá xứng đáng tiền, từ làm tóc đến gắn mi thiết kế đều tỉ mỉ, đúng giờ.'),
(4, 4, 9, 6, 4, 'Tone Douyin lên hình siêu xinh và bắt sáng tốt, chuyên viên Như Quỳnh nhiệt tình tư vấn layout hợp khuôn mặt.'),
(5, 5, 10, 7, 5, 'Makeup tone Tây dự tiệc tối cực sang, ai cũng hỏi địa chỉ studio. Chắc chắn sẽ quay lại ủng hộ!')
ON DUPLICATE KEY UPDATE rating = VALUES(rating), comment = VALUES(comment);
