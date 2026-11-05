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
public class MakeupLayoutResponse {
    private Long id;
    private String name;
    private String code;
    private String description;
    private String suitableFor;
    private String tag;
    private String gradient;
    private String borderActive;
    private String badgeClass;
    private String category;
    private String searchKeyword;
    private String thumbnailUrl;
    private Boolean active;
    private Integer displayOrder;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
