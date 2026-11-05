package com.bookingmakeup.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserVoucherSummaryResponse {
    private CustomerTierInfo tierInfo;
    private List<VoucherResponse> personalVouchers;
    private List<VoucherResponse> publicVouchers;
}
