package com.bookingmakeup.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserVoucherAssignRequest {
    @NotNull(message = "Vui lòng chọn voucher")
    private Long voucherId;

    private Long userId;

    private String userEmail;

    private String note;
}
