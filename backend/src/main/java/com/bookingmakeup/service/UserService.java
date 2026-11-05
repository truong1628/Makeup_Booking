package com.bookingmakeup.service;

import com.bookingmakeup.common.exception.BadRequestException;
import com.bookingmakeup.common.exception.PhoneAlreadyExistsException;
import com.bookingmakeup.common.exception.ResourceNotFoundException;
import com.bookingmakeup.dto.request.ChangePasswordRequest;
import com.bookingmakeup.dto.request.UpdateProfileRequest;
import com.bookingmakeup.dto.response.UserProfileResponse;
import com.bookingmakeup.entity.User;
import com.bookingmakeup.repository.BookingRepository;
import com.bookingmakeup.repository.UserRepository;
import com.bookingmakeup.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final BookingRepository bookingRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional(readOnly = true)
    public UserProfileResponse getProfile(UserPrincipal currentUser) {
        User user = getUserFromPrincipal(currentUser);
        long totalBookings = bookingRepository.countByUserId(user.getId());

        return toUserProfileResponse(user, totalBookings);
    }

    @Transactional
    public UserProfileResponse updateProfile(UserPrincipal currentUser, UpdateProfileRequest request) {
        User user = getUserFromPrincipal(currentUser);

        String newPhone = request.getPhone() != null ? request.getPhone().trim() : null;
        if (newPhone != null && !newPhone.isEmpty()) {
            userRepository.findByPhone(newPhone).ifPresent(existingUser -> {
                if (!existingUser.getId().equals(user.getId())) {
                    throw new PhoneAlreadyExistsException(newPhone);
                }
            });
            user.setPhone(newPhone);
        } else {
            user.setPhone(null);
        }

        user.setFullName(request.getFullName().trim());

        if (request.getAvatar() != null) {
            user.setAvatar(request.getAvatar().trim());
        }

        if (request.getAddress() != null) {
            user.setAddress(request.getAddress().trim());
        }

        User saved = userRepository.save(user);
        long totalBookings = bookingRepository.countByUserId(saved.getId());
        log.info("Người dùng {} (#{}) cập nhật hồ sơ cá nhân thành công", saved.getEmail(), saved.getId());

        return toUserProfileResponse(saved, totalBookings);
    }

    @Transactional
    public void changePassword(UserPrincipal currentUser, ChangePasswordRequest request) {
        User user = getUserFromPrincipal(currentUser);

        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new BadRequestException("Mật khẩu xác nhận không trùng khớp");
        }

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new BadRequestException("Mật khẩu hiện tại không chính xác");
        }

        if (request.getCurrentPassword().equals(request.getNewPassword())) {
            throw new BadRequestException("Mật khẩu mới không được trùng với mật khẩu hiện tại");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
        log.info("Người dùng {} (#{}) đổi mật khẩu thành công", user.getEmail(), user.getId());
    }

    private User getUserFromPrincipal(UserPrincipal currentUser) {
        if (currentUser == null || currentUser.getId() == null) {
            throw new BadRequestException("Phiên đăng nhập không hợp lệ hoặc đã hết hạn");
        }
        return userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Người dùng", "id", currentUser.getId()));
    }

    private UserProfileResponse toUserProfileResponse(User user, long totalBookings) {
        return UserProfileResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .phone(user.getPhone())
                .avatar(user.getAvatar())
                .address(user.getAddress())
                .role(user.getRole() != null ? user.getRole().name() : null)
                .status(user.getStatus() != null ? user.getStatus().name() : null)
                .createdAt(user.getCreatedAt())
                .totalBookings(totalBookings)
                .build();
    }
}
