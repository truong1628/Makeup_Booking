package com.bookingmakeup.controller;

import com.bookingmakeup.common.response.ApiResponse;
import com.bookingmakeup.dto.request.ServiceCategoryRequest;
import com.bookingmakeup.dto.response.ServiceCategoryResponse;
import com.bookingmakeup.service.ServiceCategoryService;
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
public class CategoryController {

    private final ServiceCategoryService serviceCategoryService;

    /**
     * Public API: Lấy danh sách danh mục dịch vụ đang hoạt động
     */
    @GetMapping("/categories")
    public ApiResponse<List<ServiceCategoryResponse>> getActiveCategories() {
        List<ServiceCategoryResponse> categories = serviceCategoryService.getActiveCategories();
        return ApiResponse.success("Lấy danh sách danh mục dịch vụ thành công", categories);
    }

    /**
     * Public API: Lấy chi tiết 1 danh mục dịch vụ
     */
    @GetMapping("/categories/{id}")
    public ApiResponse<ServiceCategoryResponse> getCategoryById(@PathVariable Long id) {
        ServiceCategoryResponse category = serviceCategoryService.getCategoryById(id);
        return ApiResponse.success("Lấy thông tin danh mục dịch vụ thành công", category);
    }

    /**
     * Admin API: Lấy tất cả danh mục dịch vụ (kể cả đang ẩn)
     */
    @GetMapping("/admin/categories")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ApiResponse<List<ServiceCategoryResponse>> getAllCategoriesForAdmin() {
        List<ServiceCategoryResponse> categories = serviceCategoryService.getAllCategoriesForAdmin();
        return ApiResponse.success("Lấy toàn bộ danh mục dịch vụ thành công", categories);
    }

    /**
     * Admin API: Tạo mới danh mục dịch vụ
     */
    @PostMapping("/admin/categories")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<ApiResponse<ServiceCategoryResponse>> createCategory(
            @Valid @RequestBody ServiceCategoryRequest request) {
        ServiceCategoryResponse created = serviceCategoryService.createCategory(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created("Tạo mới danh mục dịch vụ thành công", created));
    }

    /**
     * Admin API: Cập nhật danh mục dịch vụ
     */
    @PutMapping("/admin/categories/{id}")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ApiResponse<ServiceCategoryResponse> updateCategory(
            @PathVariable Long id,
            @Valid @RequestBody ServiceCategoryRequest request) {
        ServiceCategoryResponse updated = serviceCategoryService.updateCategory(id, request);
        return ApiResponse.success("Cập nhật danh mục dịch vụ thành công", updated);
    }

    /**
     * Admin API: Bật/tắt trạng thái hoạt động của danh mục
     */
    @PatchMapping("/admin/categories/{id}/toggle-status")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ApiResponse<ServiceCategoryResponse> toggleStatus(@PathVariable Long id) {
        ServiceCategoryResponse updated = serviceCategoryService.toggleStatus(id);
        return ApiResponse.success("Thay đổi trạng thái danh mục thành công", updated);
    }

    /**
     * Admin API: Xóa danh mục dịch vụ
     */
    @DeleteMapping("/admin/categories/{id}")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ApiResponse<Void> deleteCategory(@PathVariable Long id) {
        serviceCategoryService.deleteCategory(id);
        return ApiResponse.success("Xóa danh mục dịch vụ thành công", null);
    }
}
