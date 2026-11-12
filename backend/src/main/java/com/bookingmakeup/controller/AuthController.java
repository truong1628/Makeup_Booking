package com.bookingmakeup.controller;

import com.bookingmakeup.common.response.ApiResponse;
import com.bookingmakeup.dto.request.LoginRequest;
import com.bookingmakeup.dto.request.RegisterRequest;
import com.bookingmakeup.dto.response.AuthResponse;
import com.bookingmakeup.security.UserPrincipal;
import com.bookingmakeup.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * Controller quản lý xác thực tài khoản và phiên đăng nhập của người dùng
 * Bao gồm các chức năng đăng ký, đăng nhập và lấy thông tin tài khoản hiện tại.
 */
@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    /**
     * Public API: Đăng ký tài khoản khách hàng mới
     * Nhận thông tin đăng ký (email, mật khẩu, họ tên, số điện thoại), tạo tài khoản và trả về JWT token.
     */
    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(@Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created("Đăng ký tài khoản thành công", response));
    }

    /**
     * Public API: Đăng nhập vào hệ thống
     * Xác thực thông tin đăng nhập (email và mật khẩu), tạo phiên làm việc và trả về JWT token kèm thông tin người dùng.
     */
    @PostMapping("/login")
    public ApiResponse<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ApiResponse.success("Đăng nhập thành công", response);
    }

    /**
     * Authenticated API: Lấy thông tin tài khoản đang đăng nhập hiện tại
     * Trích xuất thông tin người dùng từ UserPrincipal (JWT Token) đã được xác thực trong SecurityContext.
     */
    @GetMapping("/me")
    public ApiResponse<Map<String, Object>> getCurrentUser(@AuthenticationPrincipal UserPrincipal currentUser) {
        if (currentUser == null) {
            return ApiResponse.error(HttpStatus.UNAUTHORIZED.value(), "Chưa xác thực người dùng");
        }

        Map<String, Object> userData = new HashMap<>();
        userData.put("id", currentUser.getId());
        userData.put("email", currentUser.getEmail());
        userData.put("fullName", currentUser.getFullName());
        userData.put("role", currentUser.getRole());
        userData.put("authorities", currentUser.getAuthorities());

        return ApiResponse.success("Lấy thông tin tài khoản thành công", userData);
    }
}
