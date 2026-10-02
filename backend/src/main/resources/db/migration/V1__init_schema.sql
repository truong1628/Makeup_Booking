-- V1__init_schema.sql
-- Makeup Booking Complete Database Schema Definition
-- Khởi tạo toàn bộ cấu trúc các bảng cho hệ thống Makeup Booking (Chuẩn 1NF, đã loại bỏ các bảng cũ)

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

-- 3. Makeup Services Table (Bảng dịch vụ đơn lẻ & gói combo)
CREATE TABLE IF NOT EXISTS makeup_services (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    service_name VARCHAR(150) NOT NULL,
    price DECIMAL(12,2) NOT NULL,
    duration INT NOT NULL DEFAULT 60,
    description TEXT,
    image LONGTEXT,
    is_combo BOOLEAN NOT NULL DEFAULT FALSE,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_services_active (active),
    INDEX idx_services_combo (is_combo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Service Combo Items Table (Chi tiết các dịch vụ con thuộc combo)
CREATE TABLE IF NOT EXISTS service_combo_items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    combo_service_id BIGINT NOT NULL,
    item_service_id BIGINT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_combo_parent FOREIGN KEY (combo_service_id) REFERENCES makeup_services(id) ON DELETE CASCADE,
    CONSTRAINT fk_combo_child FOREIGN KEY (item_service_id) REFERENCES makeup_services(id) ON DELETE RESTRICT,
    INDEX idx_combo_parent (combo_service_id),
    INDEX idx_combo_child (item_service_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Artist Schedules Table (Lịch làm việc và ngày nghỉ của thợ trang điểm)
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
    INDEX idx_schedule_artist_date (makeup_artist_id, schedule_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Bookings Table (Đơn đặt lịch - Booking Engine Model 2)
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
    layout VARCHAR(100) NULL,
    customer_image LONGTEXT NULL,
    notes TEXT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_booking_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_booking_user (user_id),
    INDEX idx_booking_date_time (booking_date, booking_time),
    INDEX idx_booking_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Booking Addresses Table (Địa chỉ thực hiện dịch vụ cho ca làm tại nhà)
CREATE TABLE IF NOT EXISTS booking_addresses (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    booking_id BIGINT NOT NULL UNIQUE,
    address VARCHAR(255) NOT NULL,
    distance_km DECIMAL(6,2) DEFAULT 0.00,
    travel_fee DECIMAL(12,2) DEFAULT 0.00,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_baddress_booking FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Booking Items Table (Chi tiết dịch vụ và thợ phụ trách trong mỗi đơn)
CREATE TABLE IF NOT EXISTS booking_items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    booking_id BIGINT NOT NULL,
    makeup_service_id BIGINT NOT NULL,
    makeup_artist_id BIGINT NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    price DECIMAL(12,2) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_bitem_booking FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    CONSTRAINT fk_bitem_service FOREIGN KEY (makeup_service_id) REFERENCES makeup_services(id) ON DELETE RESTRICT,
    CONSTRAINT fk_bitem_artist FOREIGN KEY (makeup_artist_id) REFERENCES makeup_artists(id) ON DELETE RESTRICT,
    INDEX idx_bitem_booking (booking_id),
    INDEX idx_bitem_artist_slot (makeup_artist_id, start_time, end_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Reviews Table (Đánh giá dịch vụ sau khi hoàn thành)
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
    INDEX idx_review_artist (artist_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. Payments Table (Bản ghi thanh toán cọc VNPay hoặc tại studio)
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
    INDEX idx_payment_booking (booking_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. Portfolios Table (Bộ sưu tập tác phẩm nghệ thuật của Artist)
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
    INDEX idx_portfolio_artist (makeup_artist_id),
    INDEX idx_portfolio_category (category_name),
    INDEX idx_portfolio_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
