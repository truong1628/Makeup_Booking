package com.bookingmakeup.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VoucherApplyRequest {

    @NotBlank(message = "Vui lòng nhập mã voucher")
    private String code;

    @NotNull(message = "Giá trị đơn hàng không được để trống")
    @DecimalMin(value = "0.0", message = "Giá trị đơn hàng phải lớn hơn hoặc bằng 0")
    private BigDecimal orderAmount;
}
