package com.bookingmakeup.dto.response;

import com.bookingmakeup.enums.BookingStatus;
import com.bookingmakeup.enums.ExecutionMode;
import com.bookingmakeup.enums.LocationType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BookingResponse {
    private Long id;
    private Long customerId;
    private String customerName;
    private String customerPhone;
    private LocalDate bookingDate;
    private LocalTime bookingTime;
    private LocalTime targetEndTime;
    private LocationType locationType;
    private ExecutionMode executionMode;
    private Integer artistCount;
    private String dispatchPlan;
    private BookingStatus status;
    private BigDecimal servicesPrice;
    private BigDecimal travelFee;
    private BigDecimal surcharge;
    private BigDecimal discountAmount;
    private Long voucherId;
    private String voucherCode;
    private BigDecimal totalPrice;
    private BigDecimal depositAmount;
    private String address;
    private BigDecimal distanceKm;
    private List<BookingItemResponse> items;
    private Long layoutId;
    private String layoutCode;
    private String layout;
    private String customerImage;
    private String notes;
    private String paymentMethod;
    private String paymentStatus;
    private BigDecimal totalPaid;
    private BigDecimal remainingToCollect;
    private Boolean isFullyPaid;
    private LocalDateTime createdAt;
}
