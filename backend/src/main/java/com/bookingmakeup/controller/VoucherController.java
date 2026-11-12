package com.bookingmakeup.controller;

import com.bookingmakeup.common.response.ApiResponse;
import com.bookingmakeup.dto.request.UserVoucherAssignRequest;
import com.bookingmakeup.dto.request.VoucherApplyRequest;
import com.bookingmakeup.dto.request.VoucherRequest;
import com.bookingmakeup.dto.response.UserVoucherSummaryResponse;
import com.bookingmakeup.dto.response.VoucherApplyResponse;
import com.bookingmakeup.dto.response.VoucherResponse;
import com.bookingmakeup.entity.User;
import com.bookingmakeup.enums.Role;
import com.bookingmakeup.repository.UserRepository;
import com.bookingmakeup.security.UserPrincipal;
import com.bookingmakeup.service.VoucherService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Controller quản lý mã khuyến mãi và ví voucher (Voucher / Promotion)
 * Cung cấp API công khai cho khách hàng xem và áp dụng mã giảm giá, và API quản trị cho Admin quản lý CRUD voucher và tặng voucher cho khách.
 */
@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class VoucherController {

    private final VoucherService voucherService;
    private final UserRepository userRepository;

    /**
     * API Lấy danh sách voucher công khai
     */
    @GetMapping("/vouchers")
    public ApiResponse<List<VoucherResponse>> getActiveVouchers() {
        List<VoucherResponse> vouchers = voucherService.getActiveVouchers();
        return ApiResponse.success("Lấy danh sách mã khuyến mãi thành công", vouchers);
    }

    /**
     * API Cá nhân hóa: Lấy ví voucher cá nhân + voucher công khai + hạng thành viên của khách hiện tại
     */
    @GetMapping("/vouchers/my-summary")
    public ApiResponse<UserVoucherSummaryResponse> getMyVoucherSummary(@AuthenticationPrincipal UserPrincipal currentUser) {
        Long userId = currentUser != null ? currentUser.getId() : null;
        UserVoucherSummaryResponse summary = voucherService.getUserVoucherSummary(userId);
        return ApiResponse.success("Lấy thông tin ví voucher và hạng thành viên thành công", summary);
    }

    /**
     * API Kiểm tra và áp dụng mã voucher cho đơn đặt lịch (có xét quyền sở hữu, số lần dùng và tier)
     */
    @PostMapping("/vouchers/apply")
    public ApiResponse<VoucherApplyResponse> applyVoucher(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @Valid @RequestBody VoucherApplyRequest request
    ) {
        Long userId = currentUser != null ? currentUser.getId() : null;
        VoucherApplyResponse response = voucherService.calculateVoucherDiscount(request, userId);
        return ApiResponse.success("Áp dụng mã voucher thành công", response);
    }

    /**
     * Admin API: Tặng voucher vào ví cá nhân của một khách hàng
     */
    @PostMapping("/admin/vouchers/assign")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ApiResponse<Void> assignVoucherToUser(@Valid @RequestBody UserVoucherAssignRequest request) {
        voucherService.assignVoucherToUser(request);
        return ApiResponse.success("Tặng voucher vào ví khách hàng thành công", null);
    }

    /**
     * Admin API: Lấy danh sách khách hàng để dễ dàng chọn tặng voucher
     */
    @GetMapping("/admin/vouchers/customers")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ApiResponse<List<Map<String, Object>>> getCustomersForVoucher() {
        List<User> customers = userRepository.findByRole(Role.ROLE_CUSTOMER);
        List<Map<String, Object>> result = customers.stream().map(c -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", c.getId());
            map.put("email", c.getEmail());
            map.put("fullName", c.getFullName());
            map.put("phone", c.getPhone());
            return map;
        }).toList();
        return ApiResponse.success("Lấy danh sách khách hàng thành công", result);
    }

    /**
     * Admin API: Lấy danh sách toàn bộ voucher trong hệ thống
     */
    @GetMapping("/admin/vouchers")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ApiResponse<List<VoucherResponse>> getAllVouchersForAdmin() {
        List<VoucherResponse> list = voucherService.getAllVouchersForAdmin();
        return ApiResponse.success("Lấy toàn bộ danh sách mã khuyến mãi thành công", list);
    }

    /**
     * Admin API: Lấy chi tiết voucher theo ID
     */
    @GetMapping("/admin/vouchers/{id}")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ApiResponse<VoucherResponse> getVoucherById(@PathVariable Long id) {
        VoucherResponse voucher = voucherService.getVoucherById(id);
        return ApiResponse.success("Lấy thông tin voucher thành công", voucher);
    }

    /**
     * Admin API: Tạo mới voucher
     */
    @PostMapping("/admin/vouchers")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<ApiResponse<VoucherResponse>> createVoucher(@Valid @RequestBody VoucherRequest request) {
        VoucherResponse created = voucherService.createVoucher(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created("Tạo mã khuyến mãi thành công", created));
    }

    /**
     * Admin API: Cập nhật thông tin voucher
     */
    @PutMapping("/admin/vouchers/{id}")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ApiResponse<VoucherResponse> updateVoucher(
            @PathVariable Long id,
            @Valid @RequestBody VoucherRequest request
    ) {
        VoucherResponse updated = voucherService.updateVoucher(id, request);
        return ApiResponse.success("Cập nhật mã khuyến mãi thành công", updated);
    }

    /**
     * Admin API: Bật/tắt trạng thái hoạt động của voucher
     */
    @PatchMapping("/admin/vouchers/{id}/toggle-status")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ApiResponse<VoucherResponse> toggleStatus(@PathVariable Long id) {
        VoucherResponse updated = voucherService.toggleStatus(id);
        return ApiResponse.success(Boolean.TRUE.equals(updated.getActive()) ? "Đã kích hoạt voucher" : "Đã tạm ẩn voucher", updated);
    }

    /**
     * Admin API: Xóa voucher
     */
    @DeleteMapping("/admin/vouchers/{id}")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ApiResponse<Void> deleteVoucher(@PathVariable Long id) {
        voucherService.deleteVoucher(id);
        return ApiResponse.success("Xóa voucher thành công", null);
    }
}
