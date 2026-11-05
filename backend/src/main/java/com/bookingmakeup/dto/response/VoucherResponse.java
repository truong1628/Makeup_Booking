package com.bookingmakeup.dto.response;

import com.bookingmakeup.entity.Voucher;
import com.bookingmakeup.enums.CustomerTier;
import com.bookingmakeup.enums.DiscountType;
import com.bookingmakeup.enums.VoucherScope;
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
public class VoucherResponse {

    private Long id;
    private String code;
    private String name;
    private String description;
    private DiscountType discountType;
    private BigDecimal discountValue;
    private BigDecimal maxDiscountAmount;
    private BigDecimal minOrderAmount;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private Integer usageLimit;
    private Integer usedCount;
    private Integer userUsageLimit;
    private CustomerTier targetTier;
    private String targetTierName;
    private VoucherScope voucherScope;
    private Boolean active;
    private Boolean isAvailable;

    // Các trường cá nhân hóa theo từng người dùng
    @Builder.Default
    private Boolean isPersonal = false;
    @Builder.Default
    private Boolean canApply = true;
    private String reasonIfNotApplicable;
    @Builder.Default
    private Integer userUsedCount = 0;
    private String note;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static VoucherResponse fromEntity(Voucher v) {
        if (v == null) return null;
        LocalDateTime now = LocalDateTime.now();
        boolean dateValid = (v.getStartDate() == null || !now.isBefore(v.getStartDate())) &&
                            (v.getEndDate() == null || !now.isAfter(v.getEndDate()));
        boolean usageValid = v.getUsageLimit() == null || v.getUsedCount() < v.getUsageLimit();
        boolean available = Boolean.TRUE.equals(v.getActive()) && dateValid && usageValid;

        CustomerTier tier = v.getTargetTier() != null ? v.getTargetTier() : CustomerTier.ALL;
        VoucherScope scope = v.getVoucherScope() != null ? v.getVoucherScope() : VoucherScope.PUBLIC;

        return VoucherResponse.builder()
                .id(v.getId())
                .code(v.getCode())
                .name(v.getName())
                .description(v.getDescription())
                .discountType(v.getDiscountType())
                .discountValue(v.getDiscountValue())
                .maxDiscountAmount(v.getMaxDiscountAmount())
                .minOrderAmount(v.getMinOrderAmount())
                .startDate(v.getStartDate())
                .endDate(v.getEndDate())
                .usageLimit(v.getUsageLimit())
                .usedCount(v.getUsedCount())
                .userUsageLimit(v.getUserUsageLimit())
                .targetTier(tier)
                .targetTierName(tier.getDisplayName())
                .voucherScope(scope)
                .isPersonal(scope == VoucherScope.PERSONAL)
                .active(v.getActive())
                .isAvailable(available)
                .canApply(available)
                .userUsedCount(0)
                .createdAt(v.getCreatedAt())
                .updatedAt(v.getUpdatedAt())
                .build();
    }
}
