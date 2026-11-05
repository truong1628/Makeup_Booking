package com.bookingmakeup.enums;

import lombok.Getter;

@Getter
public enum CustomerTier {
    ALL("Tất Cả Khách Hàng", 0, 0L),
    NEW("Khách Hàng Mới", 0, 0L),
    BRONZE("Hạng Đồng (Bronze)", 1, 0L),
    SILVER("Hạng Bạc (Silver)", 3, 1000000L),
    GOLD("Hạng Vàng (Gold)", 5, 3000000L),
    VIP("Hạng VIP (Diamond)", 10, 7000000L);

    private final String displayName;
    private final int minOrders;
    private final long minSpend;

    CustomerTier(String displayName, int minOrders, long minSpend) {
        this.displayName = displayName;
        this.minOrders = minOrders;
        this.minSpend = minSpend;
    }

    /**
     * Kiểm tra userTier có đủ điều kiện hưởng ưu đãi của requiredTier không
     */
    public boolean satisfies(CustomerTier requiredTier) {
        if (requiredTier == null || requiredTier == ALL) return true;
        if (requiredTier == NEW) return this == NEW;
        if (this == NEW) return false;
        return this.ordinal() >= requiredTier.ordinal();
    }
}
