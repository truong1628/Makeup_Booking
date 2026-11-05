package com.bookingmakeup.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ServiceCategoryResponse {
    private Long id;
    private String name;
    private String code;
    private String icon;
    private String description;
    private Integer displayOrder;
    private Boolean active;
    private Integer serviceCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
