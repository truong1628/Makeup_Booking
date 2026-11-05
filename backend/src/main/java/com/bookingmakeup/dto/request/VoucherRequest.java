package com.bookingmakeup.dto.request;

import com.bookingmakeup.enums.CustomerTier;
import com.bookingmakeup.enums.DiscountType;
import com.bookingmakeup.enums.VoucherScope;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VoucherRequest {

    @NotBlank(message = "Mã voucher không được để trống")
    private String code;

    @NotBlank(message = "Tên chương trình khuyến mãi không được để trống")
    private String name;

    private String description;

    @NotNull(message = "Loại chiết khấu không được để trống")
    @Builder.Default
    private DiscountType discountType = DiscountType.PERCENTAGE;

    @NotNull(message = "Giá trị chiết khấu không được để trống")
    @DecimalMin(value = "0.01", message = "Giá trị chiết khấu phải lớn hơn 0")
    private BigDecimal discountValue;

    @DecimalMin(value = "0.0", message = "Mức giảm giá tối đa phải lớn hơn hoặc bằng 0")
    private BigDecimal maxDiscountAmount;

    @Builder.Default
    @DecimalMin(value = "0.0", message = "Giá trị đơn hàng tối thiểu phải lớn hơn hoặc bằng 0")
    private BigDecimal minOrderAmount = BigDecimal.ZERO;

    private LocalDateTime startDate;

    private LocalDateTime endDate;

    @Min(value = 1, message = "Tổng số lượt sử dụng tối đa phải từ 1 trở lên")
    private Integer usageLimit;

    @Builder.Default
    @Min(value = 1, message = "Giới hạn lượt dùng mỗi khách hàng phải từ 1 trở lên")
    private Integer userUsageLimit = 1;

    @Builder.Default
    private CustomerTier targetTier = CustomerTier.ALL;

    @Builder.Default
    private VoucherScope voucherScope = VoucherScope.PUBLIC;

    @Builder.Default
    private Boolean active = true;
}
