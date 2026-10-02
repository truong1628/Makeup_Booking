package com.bookingmakeup.controller;

import com.bookingmakeup.common.response.ApiResponse;
import com.bookingmakeup.dto.request.RegisterRequest;
import com.bookingmakeup.dto.response.AuthResponse;
import com.bookingmakeup.entity.MakeupArtist;
import com.bookingmakeup.repository.MakeupArtistRepository;
import com.bookingmakeup.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import com.bookingmakeup.common.exception.BadRequestException;
import com.bookingmakeup.common.exception.ResourceNotFoundException;
import com.bookingmakeup.entity.User;
import com.bookingmakeup.repository.BookingItemRepository;
import com.bookingmakeup.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
@PreAuthorize("hasAuthority('ROLE_ADMIN')")
public class AdminController {

    private final AuthService authService;
    private final MakeupArtistRepository makeupArtistRepository;
    private final UserRepository userRepository;
    private final BookingItemRepository bookingItemRepository;
    private final PasswordEncoder passwordEncoder;

    /**
     * Admin tạo tài khoản thợ trang điểm (Artist) mới
     */
    @PostMapping("/artists")
    public ResponseEntity<ApiResponse<AuthResponse>> createArtist(@Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authService.createArtist(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created("Admin tạo tài khoản Thợ Trang Điểm thành công", response));
    }

    /**
     * Admin lấy danh sách tất cả thợ trang điểm
     */
    @GetMapping("/artists")
    @Transactional(readOnly = true)
    public ApiResponse<List<Map<String, Object>>> getAllArtists() {
        List<MakeupArtist> artists = makeupArtistRepository.findAllWithUser();
        List<Map<String, Object>> response = artists.stream().map(a -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", a.getId());
            map.put("userId", a.getUser() != null ? a.getUser().getId() : null);
            map.put("fullName", a.getUser() != null ? a.getUser().getFullName() : "Chưa đặt tên");
            map.put("email", a.getUser() != null ? a.getUser().getEmail() : "");
            map.put("phone", a.getUser() != null ? a.getUser().getPhone() : "");
            map.put("avatar", a.getUser() != null ? a.getUser().getAvatar() : null);
            map.put("experience", a.getExperience());
            map.put("specialties", a.getSpecialties());
            map.put("workingHours", a.getWorkingHours());
            map.put("workingDays", a.getWorkingDays());
            map.put("active", a.getActive() != null ? a.getActive() : true);
            map.put("createdAt", a.getCreatedAt());
            return map;
        }).toList();

        return ApiResponse.success("Lấy danh sách thợ trang điểm thành công", response);
    }

    /**
     * Admin bật/tắt trạng thái hoạt động của thợ trang điểm
     */
    @PatchMapping("/artists/{id}/toggle-status")
    @Transactional
    public ApiResponse<Map<String, Object>> toggleArtistStatus(@PathVariable Long id) {
        MakeupArtist artist = makeupArtistRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thợ trang điểm với ID: " + id));
        boolean newStatus = artist.getActive() == null || !artist.getActive();
        artist.setActive(newStatus);
        makeupArtistRepository.save(artist);
        Map<String, Object> res = new HashMap<>();
        res.put("id", artist.getId());
        res.put("active", newStatus);
        return ApiResponse.success(newStatus ? "Đã kích hoạt thợ trang điểm" : "Đã tạm ẩn thợ trang điểm", res);
    }

    /**
     * Admin cập nhật thông tin chuyên viên trang điểm
     */
    @PutMapping("/artists/{id}")
    @Transactional
    public ApiResponse<Map<String, Object>> updateArtist(
            @PathVariable Long id,
            @RequestBody Map<String, Object> request
    ) {
        MakeupArtist artist = makeupArtistRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thợ trang điểm với ID: " + id));

        User user = artist.getUser();
        if (user != null) {
            if (request.containsKey("fullName") && request.get("fullName") != null) {
                user.setFullName(request.get("fullName").toString().trim());
            }
            if (request.containsKey("phone") && request.get("phone") != null) {
                user.setPhone(request.get("phone").toString().trim());
            }
            if (request.containsKey("avatar") && request.get("avatar") != null) {
                user.setAvatar(request.get("avatar").toString().trim());
            }
            if (request.containsKey("password") && request.get("password") != null && !request.get("password").toString().isBlank()) {
                user.setPassword(passwordEncoder.encode(request.get("password").toString().trim()));
            }
            userRepository.save(user);
        }

        if (request.containsKey("experience") && request.get("experience") != null) {
            artist.setExperience(request.get("experience").toString().trim());
        }
        if (request.containsKey("specialties") && request.get("specialties") != null) {
            artist.setSpecialties(request.get("specialties").toString().trim());
        }
        if (request.containsKey("workingHours") && request.get("workingHours") != null) {
            artist.setWorkingHours(request.get("workingHours").toString().trim());
        }
        if (request.containsKey("workingDays") && request.get("workingDays") != null) {
            artist.setWorkingDays(request.get("workingDays").toString().trim());
        }
        if (request.containsKey("active") && request.get("active") != null) {
            artist.setActive(Boolean.parseBoolean(request.get("active").toString()));
        }

        makeupArtistRepository.save(artist);

        Map<String, Object> res = new HashMap<>();
        res.put("id", artist.getId());
        res.put("userId", user != null ? user.getId() : null);
        res.put("fullName", user != null ? user.getFullName() : "");
        res.put("email", user != null ? user.getEmail() : "");
        res.put("phone", user != null ? user.getPhone() : "");
        res.put("avatar", user != null ? user.getAvatar() : null);
        res.put("experience", artist.getExperience());
        res.put("specialties", artist.getSpecialties());
        res.put("workingHours", artist.getWorkingHours());
        res.put("workingDays", artist.getWorkingDays());
        res.put("active", artist.getActive());

        return ApiResponse.success("Cập nhật thông tin chuyên viên thành công", res);
    }

    /**
     * Admin xóa chuyên viên trang điểm
     */
    @DeleteMapping("/artists/{id}")
    @Transactional
    public ApiResponse<Void> deleteArtist(@PathVariable Long id) {
        MakeupArtist artist = makeupArtistRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thợ trang điểm với ID: " + id));

        if (bookingItemRepository.existsByMakeupArtistId(id)) {
            throw new BadRequestException("Chuyên viên này đã có lịch hẹn/đơn đặt trên hệ thống. Không thể xóa vĩnh viễn, bạn hãy chọn 'Tạm Ẩn' để ngưng nhận lịch!");
        }

        User user = artist.getUser();
        makeupArtistRepository.delete(artist);
        if (user != null) {
            userRepository.delete(user);
        }

        return ApiResponse.success("Đã xóa chuyên viên trang điểm thành công", null);
    }
}
