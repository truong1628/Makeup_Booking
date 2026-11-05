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

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/profile")
    public ApiResponse<UserProfileResponse> getProfile(@AuthenticationPrincipal UserPrincipal currentUser) {
        UserProfileResponse response = userService.getProfile(currentUser);
        return ApiResponse.success("Lấy hồ sơ cá nhân thành công", response);
    }

    @PutMapping("/profile")
    public ApiResponse<UserProfileResponse> updateProfile(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @Valid @RequestBody UpdateProfileRequest request
    ) {
        UserProfileResponse response = userService.updateProfile(currentUser, request);
        return ApiResponse.success("Cập nhật hồ sơ cá nhân thành công", response);
    }

    @PutMapping("/change-password")
    public ApiResponse<Void> changePassword(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @Valid @RequestBody ChangePasswordRequest request
    ) {
        userService.changePassword(currentUser, request);
        return ApiResponse.success("Đổi mật khẩu thành công", null);
    }
}
