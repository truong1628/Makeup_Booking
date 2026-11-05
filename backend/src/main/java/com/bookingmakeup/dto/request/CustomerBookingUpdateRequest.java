package com.bookingmakeup.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CustomerBookingUpdateRequest {

    @NotNull(message = "Ngày hẹn không được để trống")
    private LocalDate bookingDate;

    @NotNull(message = "Giờ bắt đầu không được để trống")
    private LocalTime bookingTime;

    private String layout;

    private String contactPhone;

    private String address;

    private String customerImage;

    private String notes;
}

