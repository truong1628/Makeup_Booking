package com.bookingmakeup.dto.request;

import com.bookingmakeup.enums.ExecutionMode;
import com.bookingmakeup.enums.LocationType;
import jakarta.validation.Valid;
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
public class BookingRequest {

    @NotNull(message = "Ngày đặt lịch không được để trống")
    private LocalDate bookingDate;

    @NotNull(message = "Giờ đặt lịch không được để trống")
    private LocalTime bookingTime;

    @Builder.Default
    private LocationType locationType = LocationType.STUDIO;

    private LocalTime targetEndTime;

    @Builder.Default
    private ExecutionMode executionMode = ExecutionMode.SINGLE;

    @Builder.Default
    private Integer artistCount = 1;

    @Builder.Default
    private String dispatchPlan = "SAVING";

    private java.math.BigDecimal surcharge;

    @Valid
    private BookingAddressRequest addressInfo;

    @NotEmpty(message = "Danh sách dịch vụ không được để trống")
    @Valid
    private List<BookingItemRequest> items;

    private Long defaultArtistId;
    private String layout;
    private String customerImage;
    private String notes;
}
