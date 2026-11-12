-- V1__init_schema.sql
-- Makeup Booking Complete Database Schema Definition (16 Tables - 3NF)

-- 1. Users Table (Người dùng: Admin, Artist, Customer)
CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    avatar LONGTEXT,
    address VARCHAR(255),
    role VARCHAR(20) NOT NULL DEFAULT 'ROLE_CUSTOMER',
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT chk_users_role CHECK (role IN ('ROLE_ADMIN', 'ROLE_ARTIST', 'ROLE_CUSTOMER')),
    CONSTRAINT chk_users_status CHECK (status IN ('ACTIVE', 'INACTIVE', 'BANNED')),
    INDEX idx_users_email (email),
    INDEX idx_users_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Makeup Artists Table (Thông tin chuyên môn và lịch hoạt động của thợ)
CREATE TABLE IF NOT EXISTS makeup_artists (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE,
    experience VARCHAR(100),
    specialties VARCHAR(255),
    working_hours VARCHAR(100),
    working_days VARCHAR(100),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_makeup_artist_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_makeup_artist_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Service Categories Table (Danh mục phân loại dịch vụ trang điểm)
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
    CONSTRAINT chk_category_order CHECK (display_order >= 0),
    INDEX idx_category_code (code),
    INDEX idx_category_active (active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Makeup Services Table (Bảng dịch vụ đơn lẻ & gói combo)
CREATE TABLE IF NOT EXISTS makeup_services (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    category_id BIGINT NULL,
    service_name VARCHAR(150) NOT NULL,
    price DECIMAL(12,2) NOT NULL,
    duration INT NOT NULL DEFAULT 60,
    description TEXT,
    image LONGTEXT,
    is_combo BOOLEAN NOT NULL DEFAULT FALSE,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_service_category FOREIGN KEY (category_id) REFERENCES service_categories(id) ON DELETE SET NULL,
    CONSTRAINT chk_service_price CHECK (price >= 0),
    CONSTRAINT chk_service_duration CHECK (duration > 0),
    INDEX idx_services_active (active),
    INDEX idx_services_combo (is_combo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Service Combo Items Table (Chi tiết các dịch vụ con thuộc combo)
CREATE TABLE IF NOT EXISTS service_combo_items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    combo_service_id BIGINT NOT NULL,
    item_service_id BIGINT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_combo_parent FOREIGN KEY (combo_service_id) REFERENCES makeup_services(id) ON DELETE CASCADE,
    CONSTRAINT fk_combo_child FOREIGN KEY (item_service_id) REFERENCES makeup_services(id) ON DELETE RESTRICT,
    CONSTRAINT chk_combo_quantity CHECK (quantity > 0),
    CONSTRAINT chk_combo_not_self CHECK (combo_service_id <> item_service_id),
    INDEX idx_combo_parent (combo_service_id),
    INDEX idx_combo_child (item_service_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Artist Schedules Table (Lịch làm việc và ngày nghỉ của thợ trang điểm)
CREATE TABLE IF NOT EXISTS artist_schedules (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    makeup_artist_id BIGINT NOT NULL,
    schedule_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_day_off BOOLEAN NOT NULL DEFAULT FALSE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_schedule_artist FOREIGN KEY (makeup_artist_id) REFERENCES makeup_artists(id) ON DELETE CASCADE,
    CONSTRAINT chk_schedule_time CHECK (end_time > start_time),
    INDEX idx_schedule_artist_date (makeup_artist_id, schedule_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Makeup Layouts Table (Danh mục phong cách trang điểm)
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
    CONSTRAINT chk_layout_order CHECK (display_order >= 0),
    INDEX idx_layout_code (code),
    INDEX idx_layout_active (active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Vouchers Table (Quản lý mã giảm giá, hạng thành viên & phạm vi áp dụng)
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
    user_usage_limit INT NULL DEFAULT 1,
    target_tier VARCHAR(20) NOT NULL DEFAULT 'ALL',
    voucher_scope VARCHAR(20) NOT NULL DEFAULT 'PUBLIC',
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT chk_voucher_values CHECK (discount_value > 0 AND min_order_amount >= 0 AND used_count >= 0),
    INDEX idx_voucher_code (code),
    INDEX idx_voucher_active (active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. User Vouchers Table (Ví voucher cá nhân của khách hàng)
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

-- 10. Bookings Table (Đơn đặt lịch - Booking Engine)
CREATE TABLE IF NOT EXISTS bookings (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    booking_date DATE NOT NULL,
    booking_time TIME NOT NULL,
    target_end_time TIME NULL,
    location_type VARCHAR(20) NOT NULL DEFAULT 'STUDIO',
    execution_mode VARCHAR(20) NOT NULL DEFAULT 'SINGLE',
    artist_count INT NOT NULL DEFAULT 1,
    dispatch_plan VARCHAR(30) NOT NULL DEFAULT 'SAVING',
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING_PAYMENT',
    total_price DECIMAL(12,2) NOT NULL,
    surcharge DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    deposit_amount DECIMAL(12,2) NOT NULL,
    layout_id BIGINT NULL,
    voucher_id BIGINT NULL,
    voucher_code VARCHAR(50) NULL,
    discount_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    layout VARCHAR(100) NULL,
    customer_image LONGTEXT NULL,
    notes TEXT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_booking_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_booking_layout FOREIGN KEY (layout_id) REFERENCES makeup_layouts(id) ON DELETE SET NULL,
    CONSTRAINT fk_booking_voucher FOREIGN KEY (voucher_id) REFERENCES vouchers(id) ON DELETE SET NULL,
    CONSTRAINT chk_booking_location CHECK (location_type IN ('STUDIO', 'HOME')),
    CONSTRAINT chk_booking_artist_count CHECK (artist_count >= 1),
    CONSTRAINT chk_booking_prices CHECK (total_price >= 0 AND surcharge >= 0 AND deposit_amount >= 0),
    INDEX idx_booking_user (user_id),
    INDEX idx_booking_date_time (booking_date, booking_time),
    INDEX idx_booking_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. Booking Addresses Table (Địa chỉ thực hiện dịch vụ cho ca làm tại nhà)
CREATE TABLE IF NOT EXISTS booking_addresses (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    booking_id BIGINT NOT NULL UNIQUE,
    address VARCHAR(255) NOT NULL,
    distance_km DECIMAL(6,2) DEFAULT 0.00,
    travel_fee DECIMAL(12,2) DEFAULT 0.00,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_baddress_booking FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    CONSTRAINT chk_baddress_distance_fee CHECK (distance_km >= 0 AND travel_fee >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. Booking Items Table (Chi tiết dịch vụ, thợ phụ trách & yêu cầu hủy/đổi ca)
CREATE TABLE IF NOT EXISTS booking_items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    booking_id BIGINT NOT NULL,
    makeup_service_id BIGINT NOT NULL,
    makeup_artist_id BIGINT NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    price DECIMAL(12,2) NOT NULL,
    cancel_requested BOOLEAN NOT NULL DEFAULT FALSE,
    cancel_reason VARCHAR(500) NULL,
    cancel_requested_at DATETIME NULL,
    cancel_status VARCHAR(30) NULL,
    original_artist_id BIGINT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_bitem_booking FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    CONSTRAINT fk_bitem_service FOREIGN KEY (makeup_service_id) REFERENCES makeup_services(id) ON DELETE RESTRICT,
    CONSTRAINT fk_bitem_artist FOREIGN KEY (makeup_artist_id) REFERENCES makeup_artists(id) ON DELETE RESTRICT,
    CONSTRAINT chk_bitem_time CHECK (end_time > start_time),
    CONSTRAINT chk_bitem_price CHECK (price >= 0),
    INDEX idx_bitem_booking (booking_id),
    INDEX idx_bitem_artist_slot (makeup_artist_id, start_time, end_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 13. Reviews Table (Đánh giá dịch vụ sau khi hoàn thành)
CREATE TABLE IF NOT EXISTS reviews (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    booking_id BIGINT NOT NULL UNIQUE,
    customer_id BIGINT NOT NULL,
    artist_id BIGINT NOT NULL,
    rating INT NOT NULL,
    comment TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_review_booking FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    CONSTRAINT fk_review_customer FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_review_artist FOREIGN KEY (artist_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT chk_review_rating CHECK (rating BETWEEN 1 AND 5),
    INDEX idx_review_artist (artist_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 14. Payments Table (Bản ghi thanh toán cọc VNPay hoặc tại studio)
CREATE TABLE IF NOT EXISTS payments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    booking_id BIGINT NOT NULL,
    payment_method VARCHAR(30) NOT NULL,
    transaction_code VARCHAR(100),
    amount DECIMAL(12,2) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    payment_date DATETIME,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_payment_booking FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    CONSTRAINT chk_payment_amount CHECK (amount >= 0),
    INDEX idx_payment_booking (booking_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 15. Portfolios Table (Bộ sưu tập tác phẩm nghệ thuật của Artist)
CREATE TABLE IF NOT EXISTS portfolios (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    makeup_artist_id BIGINT NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    image_url LONGTEXT NOT NULL,
    additional_images TEXT,
    category_name VARCHAR(100),
    tags VARCHAR(255),
    view_count INT NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_portfolio_artist FOREIGN KEY (makeup_artist_id) REFERENCES makeup_artists(id) ON DELETE CASCADE,
    CONSTRAINT chk_portfolio_views CHECK (view_count >= 0),
    INDEX idx_portfolio_artist (makeup_artist_id),
    INDEX idx_portfolio_category (category_name),
    INDEX idx_portfolio_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 16. Portfolio Images Table (Album ảnh chi tiết của từng tác phẩm - chuẩn 1NF)
CREATE TABLE IF NOT EXISTS portfolio_images (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    portfolio_id BIGINT NOT NULL,
    image_url LONGTEXT NOT NULL,
    caption VARCHAR(255) NULL,
    display_order INT NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_pimg_portfolio FOREIGN KEY (portfolio_id) REFERENCES portfolios(id) ON DELETE CASCADE,
    CONSTRAINT chk_pimg_order CHECK (display_order >= 0),
    INDEX idx_pimg_portfolio (portfolio_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
