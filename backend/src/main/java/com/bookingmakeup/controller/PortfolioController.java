package com.bookingmakeup.controller;

import com.bookingmakeup.common.response.ApiResponse;
import com.bookingmakeup.dto.response.PortfolioResponse;
import com.bookingmakeup.service.PortfolioService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controller quản lý bộ sưu tập tác phẩm trang điểm (Lookbook / Portfolio)
 * Cung cấp API công khai cho khách hàng duyệt bộ sưu tập, tìm kiếm layout makeup và xem chi tiết hình ảnh.
 */
@RestController
@RequestMapping("/api/v1/portfolios")
@RequiredArgsConstructor
public class PortfolioController {

    private final PortfolioService portfolioService;

    /**
     * Public API: Tìm kiếm và lọc danh sách tác phẩm bộ sưu tập
     * Cho phép lọc theo chuyên viên trang điểm, phân loại phong cách hoặc từ khóa tìm kiếm.
     */
    @GetMapping
    public ApiResponse<List<PortfolioResponse>> searchPortfolios(
            @RequestParam(required = false) Long artistId,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String search
    ) {
        List<PortfolioResponse> result = portfolioService.searchPortfolios(artistId, category, search);
        return ApiResponse.success("Lấy danh sách bộ sưu tập thành công", result);
    }

    /**
     * Public API: Lấy danh sách phân loại phong cách có trong bộ sưu tập (Cô Dâu, Dự Tiệc, Kỷ Yếu...)
     */
    @GetMapping("/categories")
    public ApiResponse<List<String>> getCategories() {
        List<String> categories = portfolioService.getCategories();
        return ApiResponse.success("Lấy danh mục bộ sưu tập thành công", categories);
    }

    /**
     * Public API: Lấy chi tiết tác phẩm trang điểm theo ID
     * Trả về toàn bộ ảnh chính, danh sách ảnh phụ, thông tin chuyên viên thực hiện và tự động tăng lượt xem.
     */
    @GetMapping("/{id}")
    public ApiResponse<PortfolioResponse> getPortfolioById(@PathVariable Long id) {
        PortfolioResponse portfolio = portfolioService.getPortfolioById(id);
        return ApiResponse.success("Lấy chi tiết tác phẩm thành công", portfolio);
    }
}
