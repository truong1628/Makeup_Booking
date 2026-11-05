package com.bookingmakeup.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MakeupServiceResponse {
    private Long id;
    private String serviceName;
    private BigDecimal price;
    private Integer duration;
    private String description;
    private String image;
    private Boolean isCombo;
    private Long categoryId;
    private String categoryName;
    private String categoryCode;
    private Boolean active;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<ComboItemResponse> comboItems;
}
