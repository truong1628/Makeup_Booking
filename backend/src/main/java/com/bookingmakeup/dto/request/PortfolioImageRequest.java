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
public class PortfolioImageRequest {
    @NotBlank(message = "Đường dẫn ảnh không được để trống")
    private String imageUrl;
    private String caption;
    private Integer displayOrder;
}
