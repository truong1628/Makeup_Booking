-- 1. Tạo bảng portfolio_images (Chuẩn hóa 1NF: Tách album ảnh chi tiết thành bảng riêng)
CREATE TABLE IF NOT EXISTS portfolio_images (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    portfolio_id BIGINT NOT NULL,
    image_url LONGTEXT NOT NULL,
    caption VARCHAR(255) NULL,
    display_order INT NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_pimg_portfolio FOREIGN KEY (portfolio_id) REFERENCES portfolios(id) ON DELETE CASCADE,
    INDEX idx_pimg_portfolio (portfolio_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Chèn dữ liệu mẫu an toàn: chỉ chèn nếu portfolio_id tồn tại trong bảng portfolios
INSERT INTO portfolio_images (portfolio_id, image_url, caption, display_order)
SELECT p.id, 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80', 'Góc nghiêng cận cảnh chi tiết mắt nhũ ngọc trai', 1
FROM portfolios p WHERE p.id = 1;

INSERT INTO portfolio_images (portfolio_id, image_url, caption, display_order)
SELECT p.id, 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80', 'Góc chính diện lớp nền căng bóng mọng nước', 2
FROM portfolios p WHERE p.id = 1;

INSERT INTO portfolio_images (portfolio_id, image_url, caption, display_order)
SELECT p.id, 'https://images.unsplash.com/photo-1526045612212-70caf35c14df?auto=format&fit=crop&w=800&q=80', 'Chi tiết son đỏ nhung lì và đường eyeliner mắt mèo', 1
FROM portfolios p WHERE p.id = 2;

INSERT INTO portfolio_images (portfolio_id, image_url, caption, display_order)
SELECT p.id, 'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?auto=format&fit=crop&w=800&q=80', 'Tổng thể layout dưới ánh sáng dạ tiệc đêm', 2
FROM portfolios p WHERE p.id = 2;

INSERT INTO portfolio_images (portfolio_id, image_url, caption, display_order)
SELECT p.id, 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80', 'Lớp nền tự nhiên trong veo và má hồng cam đào nhẹ nhàng', 1
FROM portfolios p WHERE p.id = 3;

INSERT INTO portfolio_images (portfolio_id, image_url, caption, display_order)
SELECT p.id, 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=800&q=80', 'Chi tiết hàng chân mày phẩy sợi và son tone đất', 1
FROM portfolios p WHERE p.id = 4;
