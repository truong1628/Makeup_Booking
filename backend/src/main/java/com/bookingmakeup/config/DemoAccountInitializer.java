package com.bookingmakeup.config;

import com.bookingmakeup.entity.User;
import com.bookingmakeup.enums.Role;
import com.bookingmakeup.enums.UserStatus;
import com.bookingmakeup.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.Optional;

/**
 * Tự động đồng bộ và cố định mật khẩu '123456' cho các tài khoản mẫu mỗi khi ứng dụng khởi chạy.
 * Đảm bảo mật khẩu không bao giờ bị thay đổi hay lệch dữ liệu.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class DemoAccountInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        syncAccounts();
    }

    public void syncAccounts() {
        log.info("==> [DemoAccountInitializer] Khởi tạo & cố định mật khẩu '123456' cho các tài khoản mẫu...");

        ensureAccount("admin@gmail.com", "123456", "Admin System", "0901234567", Role.ROLE_ADMIN);
        ensureAccount("dung@gmail.com", "123456", "Dung Dorys", "0999999999", Role.ROLE_ARTIST);
        ensureAccount("linh.artist@gmail.com", "123456", "Nguyễn Thùy Linh", "0912345678", Role.ROLE_ARTIST);
        ensureAccount("customer@gmail.com", "123456", "Khách Hàng Mẫu", "0987654321", Role.ROLE_CUSTOMER);

        log.info("==> [DemoAccountInitializer] Đã đồng bộ xong 4 tài khoản mẫu (Password luôn cố định: 123456).");
    }

    private void ensureAccount(String email, String rawPassword, String fullName, String phone, Role role) {
        try {
            Optional<User> userOpt = userRepository.findByEmail(email);
            if (userOpt.isPresent()) {
                User user = userOpt.get();
                user.setPassword(passwordEncoder.encode(rawPassword));
                user.setStatus(UserStatus.ACTIVE);
                userRepository.save(user);
            } else {
                User newUser = User.builder()
                        .email(email)
                        .password(passwordEncoder.encode(rawPassword))
                        .fullName(fullName)
                        .phone(phone)
                        .role(role)
                        .status(UserStatus.ACTIVE)
                        .build();
                userRepository.save(newUser);
            }
        } catch (Exception e) {
            log.warn("Không thể đồng bộ tài khoản mẫu '{}': {}", email, e.getMessage());
        }
    }
}
