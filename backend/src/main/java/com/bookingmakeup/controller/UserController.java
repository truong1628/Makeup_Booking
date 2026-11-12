package com.bookingmakeup.controller;

import com.bookingmakeup.common.response.ApiResponse;
import com.bookingmakeup.dto.request.ChangePasswordRequest;
import com.bookingmakeup.dto.request.UpdateProfileRequest;
import com.bookingmakeup.dto.response.UserProfileResponse;
import com.bookingmakeup.security.UserPrincipal;
import com.bookingmakeup.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

/**
 * Controller quản lý hồ sơ và tài khoản người dùng cá nhân
 * Cung cấp các API xem hồ sơ, chỉnh sửa thông tin cá nhân và thay đổi mật khẩu.
 */
@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    /**
     * Authenticated API: Lấy thông tin chi tiết hồ sơ cá nhân của người dùng hiện tại
     * Trả về họ tên, email, số điện thoại, ảnh đại diện, vai trò và địa chỉ mặc định.
     */
    @GetMapping("/profile")
    public ApiResponse<UserProfileResponse> getProfile(@AuthenticationPrincipal UserPrincipal currentUser) {
        UserProfileResponse response = userService.getProfile(currentUser);
        return ApiResponse.success("Lấy hồ sơ cá nhân thành công", response);
    }

    /**
     * Authenticated API: Cập nhật thông tin hồ sơ cá nhân của người dùng
     * Cho phép chỉnh sửa họ tên, số điện thoại, avatar và địa chỉ liên lạc.
     */
    @PutMapping("/profile")
    public ApiResponse<UserProfileResponse> updateProfile(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @Valid @RequestBody UpdateProfileRequest request
    ) {
        UserProfileResponse response = userService.updateProfile(currentUser, request);
        return ApiResponse.success("Cập nhật hồ sơ cá nhân thành công", response);
    }

    /**
     * Authenticated API: Đổi mật khẩu tài khoản người dùng
     * Kiểm tra mật khẩu hiện tại và mã hóa lưu trữ mật khẩu mới vào cơ sở dữ liệu.
     */
    @PutMapping("/change-password")
    public ApiResponse<Void> changePassword(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @Valid @RequestBody ChangePasswordRequest request
    ) {
        userService.changePassword(currentUser, request);
        return ApiResponse.success("Đổi mật khẩu thành công", null);
    }
}
