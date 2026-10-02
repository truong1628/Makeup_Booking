package com.bookingmakeup.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ComboItemRequest {

    @NotNull(message = "ID dịch vụ thành phần không được để trống")
    private Long serviceId;

    @Builder.Default
    @Min(value = 1, message = "Số lượng dịch vụ thành phần phải lớn hơn hoặc bằng 1")
    private Integer quantity = 1;
}
