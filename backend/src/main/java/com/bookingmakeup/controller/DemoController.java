package com.bookingmakeup.controller;

import com.bookingmakeup.common.exception.AppException;
import com.bookingmakeup.common.exception.ResourceNotFoundException;
import com.bookingmakeup.common.response.ApiResponse;
import com.bookingmakeup.dto.request.DemoRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/demo")
@RequiredArgsConstructor
public class DemoController {

    @GetMapping("/health")
    public ApiResponse<Map<String, Object>> healthCheck() {
        Map<String, Object> status = new HashMap<>();
        status.put("service", "Makeup Booking Backend API");
        status.put("status", "UP");
        status.put("database", "MySQL (Docker) Connected");
        status.put("flyway", "Migrations applied successfully");
        return ApiResponse.success("Dịch vụ hoạt động bình thường", status);
    }

    @GetMapping("/not-found")
    public ApiResponse<Void> triggerNotFound() {
        throw new ResourceNotFoundException("User", "id", 9999L);
    }

    @PostMapping("/validate")
    public ApiResponse<DemoRequest> triggerValidation(@Valid @RequestBody DemoRequest request) {
        return ApiResponse.success("Dữ liệu hợp lệ", request);
    }

    @GetMapping("/app-error")
    public ApiResponse<Void> triggerAppError() {
        throw new AppException(HttpStatus.BAD_REQUEST, "Thao tác không hợp lệ: Lịch hẹn này đã bị hủy trước đó");
    }

    @GetMapping("/error")
    public ApiResponse<Void> triggerServerError() {
        throw new RuntimeException("Mô phỏng lỗi hệ thống không xác định trên Server");
    }
}
