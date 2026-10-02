package com.bookingmakeup.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ComboItemResponse {
    private Long id;
    private Long itemServiceId;
    private String itemServiceName;
    private BigDecimal unitPrice;
    private Integer duration;
    private Integer quantity;
    private BigDecimal subTotal;
}
