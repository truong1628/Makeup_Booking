package com.bookingmakeup.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BookingItemResponse {
    private Long id;
    private Long makeupServiceId;
    private String serviceName;
    private Long makeupArtistId;
    private String artistName;
    private LocalTime startTime;
    private LocalTime endTime;
    private BigDecimal price;
}
