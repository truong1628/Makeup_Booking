package com.bookingmakeup.service;

import com.bookingmakeup.common.exception.EmailAlreadyExistsException;
import com.bookingmakeup.common.exception.PhoneAlreadyExistsException;
import com.bookingmakeup.dto.request.LoginRequest;
import com.bookingmakeup.dto.request.RegisterRequest;
import com.bookingmakeup.dto.response.AuthResponse;
import com.bookingmakeup.entity.MakeupArtist;
import com.bookingmakeup.entity.User;
import com.bookingmakeup.enums.Role;
import com.bookingmakeup.enums.UserStatus;
import com.bookingmakeup.repository.MakeupArtistRepository;
import com.bookingmakeup.repository.UserRepository;
import com.bookingmakeup.security.JwtUtils;
import com.bookingmakeup.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service xử lý nghiệp vụ xác thực người dùng, bảo mật và quản lý tài khoản
 * Cung cấp logic đăng ký khách hàng, Admin tạo chuyên viên, mã hóa mật khẩu và tạo JWT Token.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final MakeupArtistRepository makeupArtistRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;
    private final AuthenticationManager authenticationManager;

    /**
     * Đăng ký tài khoản khách hàng mới vào hệ thống
     * Kiểm tra trùng lặp email/SĐT, mã hóa mật khẩu BCrypt, mặc định gán ROLE_CUSTOMER và cấp phát JWT token.
     */
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String email = request.getEmail().trim().toLowerCase();

        if (userRepository.existsByEmail(email)) {
            throw new EmailAlreadyExistsException(email);
        }

        String phone = request.getPhone() != null ? request.getPhone().trim() : null;
        if (phone != null && !phone.isEmpty()) {
            if (userRepository.existsByPhone(phone)) {
                throw new PhoneAlreadyExistsException(phone);
            }
        }

        // Đăng ký công khai luôn luôn là ROLE_CUSTOMER
        User user = User.builder()
                .email(email)
                .fullName(request.getFullName().trim())
                .phone(phone)
                .password(passwordEncoder.encode(request.getPassword()))
                .role(Role.ROLE_CUSTOMER)
                .status(UserStatus.ACTIVE)
                .build();

        User savedUser = userRepository.save(user);

        UserPrincipal principal = UserPrincipal.create(savedUser);
        String token = jwtUtils.generateToken(principal);

        log.info("Khách hàng đăng ký thành công: {}", savedUser.getEmail());

        return AuthResponse.builder()
                .token(token)
                .id(savedUser.getId())
                .email(savedUser.getEmail())
                .fullName(savedUser.getFullName())
                .role(savedUser.getRole().name())
                .phone(savedUser.getPhone())
                .avatar(savedUser.getAvatar())
                .address(savedUser.getAddress())
                .build();
    }

    /**
     * Admin tạo tài khoản thợ trang điểm (Makeup Artist) mới
     * Thiết lập quyền ROLE_ARTIST, khởi tạo bản ghi hồ sơ thợ kèm kinh nghiệm, giờ làm việc và trạng thái active.
     */
    @Transactional
    public AuthResponse createArtist(RegisterRequest request) {
        String email = request.getEmail().trim().toLowerCase();

        if (userRepository.existsByEmail(email)) {
            throw new EmailAlreadyExistsException(email);
        }

        String phone = request.getPhone() != null ? request.getPhone().trim() : null;
        if (phone != null && !phone.isEmpty()) {
            if (userRepository.existsByPhone(phone)) {
                throw new PhoneAlreadyExistsException(phone);
            }
        }

        // Tạo tài khoản User với quyền ROLE_ARTIST do Admin chỉ định
        User user = User.builder()
                .email(email)
                .fullName(request.getFullName().trim())
                .phone(phone)
                .password(passwordEncoder.encode(request.getPassword()))
                .role(Role.ROLE_ARTIST)
                .status(UserStatus.ACTIVE)
                .build();

        User savedUser = userRepository.save(user);

        // Tạo hồ sơ MakeupArtist
        MakeupArtist makeupArtist = MakeupArtist.builder()
                .user(savedUser)
                .experience(request.getExperience() != null ? request.getExperience() : "Chưa cập nhật kinh nghiệm")
                .workingHours(request.getWorkingHours() != null ? request.getWorkingHours() : "Cả ngày")
                .workingDays(request.getWorkingDays() != null ? request.getWorkingDays() : "Thứ 2 - Chủ Nhật")
                .active(true)
                .build();

        makeupArtistRepository.save(makeupArtist);
        log.info("Admin đã tạo mới tài khoản Thợ Trang Điểm thành công: {}", savedUser.getEmail());

        UserPrincipal principal = UserPrincipal.create(savedUser);
        String token = jwtUtils.generateToken(principal);

        return AuthResponse.builder()
                .token(token)
                .id(savedUser.getId())
                .email(savedUser.getEmail())
                .fullName(savedUser.getFullName())
                .role(savedUser.getRole().name())
                .phone(savedUser.getPhone())
                .avatar(savedUser.getAvatar())
                .address(savedUser.getAddress())
                .build();
    }

    /**
     * Xác thực thông tin đăng nhập của người dùng qua Spring Security AuthenticationManager
     * Kiểm tra tính hợp lệ của email và mật khẩu, trích xuất UserPrincipal và tạo chuỗi JWT token.
     */
    public AuthResponse login(LoginRequest request) {
        String email = request.getEmail().trim().toLowerCase();

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(email, request.getPassword())
        );

        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
        String token = jwtUtils.generateToken(principal);

        User user = userRepository.findByEmail(email).orElse(null);

        log.info("Người dùng đăng nhập thành công: {}", email);

        return AuthResponse.builder()
                .token(token)
                .id(principal.getId())
                .email(principal.getEmail())
                .fullName(principal.getFullName())
                .role(principal.getRole())
                .phone(user != null ? user.getPhone() : null)
                .avatar(user != null ? user.getAvatar() : null)
                .address(user != null ? user.getAddress() : null)
                .build();
    }
}
