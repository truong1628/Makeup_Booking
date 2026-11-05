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
public class PortfolioCreateRequest {

    @NotBlank(message = "Tiêu đề tác phẩm không được để trống")
    private String title;

    private String description;

    @NotBlank(message = "Vui lòng chọn hoặc tải lên ảnh tác phẩm")
    private String imageUrl;

    private String additionalImages;

    private java.util.List<PortfolioImageRequest> gallery;

    private String categoryName;

    private String tags;
}
