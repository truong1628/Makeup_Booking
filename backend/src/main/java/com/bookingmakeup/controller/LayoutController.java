package com.bookingmakeup.controller;

import com.bookingmakeup.common.response.ApiResponse;
import com.bookingmakeup.dto.request.MakeupLayoutRequest;
import com.bookingmakeup.dto.response.MakeupLayoutResponse;
import com.bookingmakeup.service.MakeupLayoutService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class LayoutController {

    private final MakeupLayoutService makeupLayoutService;

    /**
     * Public API: Lấy danh sách phong cách makeup đang hoạt động (cho khách chọn khi đặt lịch)
     */
    @GetMapping("/layouts")
    public ApiResponse<List<MakeupLayoutResponse>> getActiveLayouts() {
        List<MakeupLayoutResponse> layouts = makeupLayoutService.getActiveLayouts();
        return ApiResponse.success("Lấy danh sách phong cách trang điểm thành công", layouts);
    }

    /**
     * Public API: Lấy chi tiết 1 phong cách makeup
     */
    @GetMapping("/layouts/{id}")
    public ApiResponse<MakeupLayoutResponse> getLayoutById(@PathVariable Long id) {
        MakeupLayoutResponse layout = makeupLayoutService.getLayoutById(id);
        return ApiResponse.success("Lấy thông tin phong cách trang điểm thành công", layout);
    }

    /**
     * Admin API: Lấy tất cả phong cách makeup (bao gồm đang ẩn)
     */
    @GetMapping("/admin/layouts")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ApiResponse<List<MakeupLayoutResponse>> getAllLayoutsForAdmin() {
        List<MakeupLayoutResponse> layouts = makeupLayoutService.getAllLayoutsForAdmin();
        return ApiResponse.success("Lấy toàn bộ danh sách phong cách trang điểm thành công", layouts);
    }

    /**
     * Admin API: Tạo mới phong cách makeup
     */
    @PostMapping("/admin/layouts")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<ApiResponse<MakeupLayoutResponse>> createLayout(
            @Valid @RequestBody MakeupLayoutRequest request) {
        MakeupLayoutResponse created = makeupLayoutService.createLayout(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created("Tạo mới phong cách trang điểm thành công", created));
    }

    /**
     * Admin API: Cập nhật phong cách makeup
     */
    @PutMapping("/admin/layouts/{id}")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ApiResponse<MakeupLayoutResponse> updateLayout(
            @PathVariable Long id,
            @Valid @RequestBody MakeupLayoutRequest request) {
        MakeupLayoutResponse updated = makeupLayoutService.updateLayout(id, request);
        return ApiResponse.success("Cập nhật phong cách trang điểm thành công", updated);
    }

    /**
     * Admin API: Bật/tắt trạng thái hiển thị
     */
    @PatchMapping("/admin/layouts/{id}/toggle-status")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ApiResponse<MakeupLayoutResponse> toggleStatus(@PathVariable Long id) {
        MakeupLayoutResponse updated = makeupLayoutService.toggleStatus(id);
        return ApiResponse.success("Thay đổi trạng thái hiển thị thành công", updated);
    }

    /**
     * Admin API: Xóa phong cách makeup
     */
    @DeleteMapping("/admin/layouts/{id}")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ApiResponse<Void> deleteLayout(@PathVariable Long id) {
        makeupLayoutService.deleteLayout(id);
        return ApiResponse.success("Xóa phong cách trang điểm thành công", null);
    }
}
