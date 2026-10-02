package com.bookingmakeup.dto.request;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DispatchEstimateRequest {

    @NotNull(message = "Ngày hẹn không được để trống")
    private LocalDate bookingDate;

    // Giờ khách mong muốn xong (Target End Time)
    private LocalTime targetEndTime;

    // Giờ khách muốn bắt đầu (nếu chọn chế độ bắt đầu)
    private LocalTime bookingTime;

    @Builder.Default
    private Boolean isTargetEndTimeMode = true;

    @NotEmpty(message = "Danh sách dịch vụ không được để trống")
    private List<ServiceItemQty> items;

    // Chuyên viên ưa thích (nếu khách chọn)
    private Long preferredArtistId;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ServiceItemQty {
        private Long serviceId;
        private Integer quantity;
    }
}
