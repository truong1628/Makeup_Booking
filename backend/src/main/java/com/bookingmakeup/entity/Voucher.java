package com.bookingmakeup.entity;

import com.bookingmakeup.enums.DiscountType;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "vouchers")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Voucher extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String code;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "discount_type", nullable = false, length = 20)
    @Builder.Default
    private DiscountType discountType = DiscountType.PERCENTAGE;

    @Column(name = "discount_value", nullable = false, precision = 12, scale = 2)
    private BigDecimal discountValue;

    @Column(name = "max_discount_amount", precision = 12, scale = 2)
    private BigDecimal maxDiscountAmount;

    @Column(name = "min_order_amount", nullable = false, precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal minOrderAmount = BigDecimal.ZERO;

    @Column(name = "start_date")
    private LocalDateTime startDate;

    @Column(name = "end_date")
    private LocalDateTime endDate;

    @Column(name = "usage_limit")
    private Integer usageLimit;

    @Column(name = "used_count", nullable = false)
    @Builder.Default
    private Integer usedCount = 0;

    @Column(name = "user_usage_limit")
    @Builder.Default
    private Integer userUsageLimit = 1;

    @Enumerated(EnumType.STRING)
    @Column(name = "target_tier", nullable = false, length = 20)
    @Builder.Default
    private com.bookingmakeup.enums.CustomerTier targetTier = com.bookingmakeup.enums.CustomerTier.ALL;

    @Enumerated(EnumType.STRING)
    @Column(name = "voucher_scope", nullable = false, length = 20)
    @Builder.Default
    private com.bookingmakeup.enums.VoucherScope voucherScope = com.bookingmakeup.enums.VoucherScope.PUBLIC;

    @Column(nullable = false)
    @Builder.Default
    private Boolean active = true;
}
