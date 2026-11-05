package com.bookingmakeup.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MakeupLayoutRequest {

    @NotBlank(message = "Tên phong cách makeup không được để trống")
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

    @Builder.Default
    private Boolean active = true;

    @Builder.Default
    private Integer displayOrder = 0;
}
