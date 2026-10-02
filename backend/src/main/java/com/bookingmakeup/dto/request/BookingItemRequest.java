package com.bookingmakeup.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BookingItemRequest {

    @NotNull(message = "ID dịch vụ makeup không được để trống")
    private Long makeupServiceId;

    private Long makeupArtistId;
}
