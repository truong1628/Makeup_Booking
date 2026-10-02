package com.bookingmakeup.controller;

import com.bookingmakeup.common.response.ApiResponse;
import com.bookingmakeup.dto.response.PortfolioResponse;
import com.bookingmakeup.service.PortfolioService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/portfolios")
@RequiredArgsConstructor
public class PortfolioController {

    private final PortfolioService portfolioService;

    /**
     * 1. Khách hàng xem danh sách tác phẩm bộ sưu tập (có tìm kiếm và lọc)
     * @param artistId (Tùy chọn) lọc theo mã thợ
     * @param category (Tùy chọn) lọc theo phong cách
     * @param search   (Tùy chọn) tìm kiếm theo tiêu đề, tags, tên thợ
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
     * 2. Lấy danh sách các danh mục / phong cách tác phẩm
     */
    @GetMapping("/categories")
    public ApiResponse<List<String>> getCategories() {
        List<String> categories = portfolioService.getCategories();
        return ApiResponse.success("Lấy danh mục bộ sưu tập thành công", categories);
    }

    /**
     * 3. Xem chi tiết tác phẩm bộ sưu tập
     */
    @GetMapping("/{id}")
    public ApiResponse<PortfolioResponse> getPortfolioById(@PathVariable Long id) {
        PortfolioResponse portfolio = portfolioService.getPortfolioById(id);
        return ApiResponse.success("Lấy chi tiết tác phẩm thành công", portfolio);
    }
}
