package com.bookingmakeup.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DispatchOptionResponse {
    private String planCode; // SAVING | BALANCED | SPEED
    private String planName; // Tên gói hiển thị
    private String badge; // Nhãn nổi bật
    private String description;
    private Integer artistCount;
    private Integer availableArtistCount; // Số chuyên viên rảnh trong khung giờ
    private Integer totalActiveArtists;   // Tổng số chuyên viên của studio
    private LocalTime startTime;
    private LocalTime endTime;
    private Integer durationMinutes;
    private Boolean isLate;
    private Integer diffMinutes;
    private LocalTime recommendedStartTime;
    private BigDecimal servicesPrice;
    private BigDecimal rushFee;        // Phụ phí điều phối thợ hỏa tốc
    private BigDecimal earlyFee;       // Phụ phí làm sớm (trước 06:00 sáng)
    private BigDecimal totalSurcharge; // rushFee + earlyFee
    private BigDecimal discountAmount; // Chiết khấu (ví dụ Gói Tiết Kiệm -15%)
    private BigDecimal totalPrice;
    private BigDecimal depositAmount;
    private List<ArtistTimelineDto> timelines;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ArtistTimelineDto {
        private Long artistId;
        private String artistName;
        private String avatar;
        private LocalTime startTime;
        private LocalTime endTime;
        private List<SlotItemDto> slots;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SlotItemDto {
        private Long serviceId;
        private String serviceName;
        private LocalTime startTime;
        private LocalTime endTime;
        private Integer duration;
        private BigDecimal price;
    }
}
