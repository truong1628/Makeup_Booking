package com.bookingmakeup.dto.response;

import com.bookingmakeup.enums.CustomerTier;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CustomerTierInfo {
    private CustomerTier currentTier;
    private String tierName;
    private int completedBookings;
    private BigDecimal totalSpent;
    private CustomerTier nextTier;
    private String nextTierName;
    private BigDecimal nextTierSpendRequired;
    private int progressPercent;
    private String description;
}
