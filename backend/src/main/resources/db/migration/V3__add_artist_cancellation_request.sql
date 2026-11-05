-- V3: Bổ sung các trường phục vụ tính năng Artist yêu cầu hủy ca làm và Admin duyệt đổi thợ
ALTER TABLE booking_items
ADD COLUMN cancel_requested BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN cancel_reason VARCHAR(500) NULL,
ADD COLUMN cancel_requested_at DATETIME NULL,
ADD COLUMN cancel_status VARCHAR(30) NULL,
ADD COLUMN original_artist_id BIGINT NULL;
