package com.bookingmakeup.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ServiceCreateRequest {

    @NotBlank(message = "Tên dịch vụ không được để trống")
    @Size(min = 2, max = 150, message = "Tên dịch vụ phải từ 2 đến 150 ký tự")
    private String serviceName;

    @NotNull(message = "Giá dịch vụ không được để trống")
    @PositiveOrZero(message = "Giá dịch vụ phải lớn hơn hoặc bằng 0")
    private BigDecimal price;

    private Integer duration;

    private String description;

    private String image;

    @Builder.Default
    private Boolean isCombo = false;

    private Boolean active;

    @Valid
    private List<ComboItemRequest> comboItems;
}
