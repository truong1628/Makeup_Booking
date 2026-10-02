package com.bookingmakeup.dto.request;

import com.bookingmakeup.enums.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RegisterRequest {

    @NotBlank(message = "Họ và tên không được để trống")
    @Size(min = 2, max = 100, message = "Họ và tên phải từ 2 đến 100 ký tự")
    private String fullName;

    @NotBlank(message = "Email không được để trống")
    @Email(message = "Email không đúng định dạng")
    private String email;

    @NotBlank(message = "Số điện thoại không được để trống")
    @jakarta.validation.constraints.Pattern(regexp = "^(84|0[3|5|7|8|9])+([0-9]{8})$", message = "Số điện thoại không hợp lệ (Ví dụ: 0912345678)")
    private String phone;

    @NotBlank(message = "Mật khẩu không được để trống")
    @Size(min = 6, message = "Mật khẩu phải có ít nhất 6 ký tự")
    private String password;

    private Role role;

    // Các trường tùy chọn khi đăng ký Artist
    private String experience;
    private String specialties;
    private String workingHours;
    private String workingDays;
}
