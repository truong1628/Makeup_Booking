package com.bookingmakeup.controller;

import com.bookingmakeup.common.response.ApiResponse;
import com.bookingmakeup.dto.request.ServiceCreateRequest;
import com.bookingmakeup.dto.response.MakeupServiceResponse;
import com.bookingmakeup.service.MakeupServiceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/services")
@RequiredArgsConstructor
public class ServiceController {

    private final MakeupServiceService makeupServiceService;

    @GetMapping
    public ApiResponse<List<MakeupServiceResponse>> getServices(
            @RequestParam(required = false) Boolean isCombo
    ) {
        List<MakeupServiceResponse> services = makeupServiceService.getActiveServices(isCombo);
        return ApiResponse.success("Lấy danh sách dịch vụ thành công", services);
    }

    @GetMapping("/combos")
    public ApiResponse<List<MakeupServiceResponse>> getCombos() {
        List<MakeupServiceResponse> combos = makeupServiceService.getActiveCombos();
        return ApiResponse.success("Lấy danh sách gói combo thành công", combos);
    }

    @GetMapping("/{id}")
    public ApiResponse<MakeupServiceResponse> getServiceById(@PathVariable Long id) {
        MakeupServiceResponse service = makeupServiceService.getServiceById(id);
        return ApiResponse.success("Lấy chi tiết dịch vụ thành công", service);
    }

    @PostMapping
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_ARTIST')")
    public ResponseEntity<ApiResponse<MakeupServiceResponse>> createService(
            @Valid @RequestBody ServiceCreateRequest request
    ) {
        MakeupServiceResponse response = makeupServiceService.createService(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created(
                        Boolean.TRUE.equals(request.getIsCombo()) ? "Tạo gói combo thành công" : "Tạo dịch vụ thành công",
                        response
                ));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_ARTIST')")
    public ApiResponse<MakeupServiceResponse> updateService(
            @PathVariable Long id,
            @Valid @RequestBody ServiceCreateRequest request
    ) {
        MakeupServiceResponse response = makeupServiceService.updateService(id, request);
        return ApiResponse.success("Cập nhật dịch vụ thành công", response);
    }

    @GetMapping("/admin/all")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ApiResponse<List<MakeupServiceResponse>> getAllServicesForAdmin() {
        List<MakeupServiceResponse> services = makeupServiceService.getAllServicesForAdmin();
        return ApiResponse.success("Lấy toàn bộ danh sách dịch vụ cho quản trị viên thành công", services);
    }

    @PatchMapping("/{id}/toggle-status")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ApiResponse<MakeupServiceResponse> toggleStatus(@PathVariable Long id) {
        MakeupServiceResponse response = makeupServiceService.toggleStatus(id);
        return ApiResponse.success("Đổi trạng thái dịch vụ thành công", response);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ApiResponse<Void> deleteService(@PathVariable Long id) {
        makeupServiceService.deleteService(id);
        return ApiResponse.success("Xóa dịch vụ thành công", null);
    }
}
