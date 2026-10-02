package com.bookingmakeup.controller;

import com.bookingmakeup.common.exception.BadRequestException;
import com.bookingmakeup.common.exception.ResourceNotFoundException;
import com.bookingmakeup.common.response.ApiResponse;
import com.bookingmakeup.entity.ArtistSchedule;
import com.bookingmakeup.entity.BookingAddress;
import com.bookingmakeup.entity.BookingItem;
import com.bookingmakeup.entity.MakeupArtist;
import com.bookingmakeup.dto.request.PortfolioCreateRequest;
import com.bookingmakeup.dto.response.PortfolioResponse;
import com.bookingmakeup.repository.ArtistScheduleRepository;
import com.bookingmakeup.repository.BookingAddressRepository;
import com.bookingmakeup.repository.BookingItemRepository;
import com.bookingmakeup.repository.MakeupArtistRepository;
import com.bookingmakeup.security.UserPrincipal;
import com.bookingmakeup.service.PortfolioService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import com.bookingmakeup.repository.UserRepository;
import com.bookingmakeup.entity.User;

@Slf4j
@RestController
@RequestMapping("/api/v1/artist")
@RequiredArgsConstructor
@PreAuthorize("hasAnyAuthority('ROLE_ARTIST', 'ROLE_ADMIN')")
public class ArtistController {

    private final MakeupArtistRepository makeupArtistRepository;
    private final BookingItemRepository bookingItemRepository;
    private final BookingAddressRepository bookingAddressRepository;
    private final ArtistScheduleRepository artistScheduleRepository;
    private final PortfolioService portfolioService;
    private final UserRepository userRepository;

    private MakeupArtist getArtistFromPrincipal(UserPrincipal currentUser) {
        return makeupArtistRepository.findByUserId(currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("MakeupArtist", "userId", currentUser.getId()));
    }

    /**
     * 1. Thợ lấy danh sách các ca làm việc (Assignments) được phân bổ cho mình
     */
    @GetMapping("/assignments")
    @Transactional(readOnly = true)
    public ApiResponse<List<Map<String, Object>>> getMyAssignments(@AuthenticationPrincipal UserPrincipal currentUser) {
        MakeupArtist artist = getArtistFromPrincipal(currentUser);
        List<BookingItem> items = bookingItemRepository.findByArtistIdOrderByDateAndTime(artist.getId());

        List<Map<String, Object>> result = items.stream().map(item -> {
            Map<String, Object> map = new HashMap<>();
            map.put("itemId", item.getId());
            map.put("bookingId", item.getBooking().getId());
            map.put("bookingDate", item.getBooking().getBookingDate());
            map.put("startTime", item.getStartTime());
            map.put("endTime", item.getEndTime());
            map.put("serviceName", item.getMakeupService().getServiceName());
            map.put("duration", item.getMakeupService().getDuration());
            map.put("price", item.getPrice());
            map.put("bookingStatus", item.getBooking().getStatus());
            map.put("locationType", item.getBooking().getLocationType());
            map.put("executionMode", item.getBooking().getExecutionMode());

            // Thông tin khách hàng
            map.put("customerName", item.getBooking().getUser().getFullName());
            map.put("customerPhone", item.getBooking().getUser().getPhone());

            // Địa chỉ nếu làm tại nhà
            Optional<BookingAddress> addrOpt = bookingAddressRepository.findByBookingId(item.getBooking().getId());
            if (addrOpt.isPresent()) {
                map.put("address", addrOpt.get().getAddress());
                map.put("distanceKm", addrOpt.get().getDistanceKm());
            } else {
                map.put("address", "Tại Studio Lumière (120 Phố Huế, Q. Hai Bà Trưng)");
                map.put("distanceKm", 0);
            }

            return map;
        }).toList();

        return ApiResponse.success("Lấy danh sách ca làm việc của thợ thành công", result);
    }

    /**
     * 2. Lấy danh sách lịch làm việc và ngày nghỉ của cá nhân thợ
     */
    @GetMapping("/schedules")
    @Transactional(readOnly = true)
    public ApiResponse<List<ArtistSchedule>> getMySchedules(@AuthenticationPrincipal UserPrincipal currentUser) {
        MakeupArtist artist = getArtistFromPrincipal(currentUser);
        List<ArtistSchedule> schedules = artistScheduleRepository.findByMakeupArtistIdOrderByScheduleDateAsc(artist.getId());
        return ApiResponse.success("Lấy danh sách lịch biểu thợ thành công", schedules);
    }

    /**
     * 3. Thợ tự đăng ký ngày nghỉ phép (Khóa slot không cho khách đặt trùng vào ngày đó)
     */
    @PostMapping("/schedules/day-off")
    @Transactional
    public ApiResponse<ArtistSchedule> registerDayOff(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @RequestBody Map<String, Object> body
    ) {
        MakeupArtist artist = getArtistFromPrincipal(currentUser);

        String dateStr = (String) body.get("scheduleDate");
        if (dateStr == null || dateStr.trim().isEmpty()) {
            throw new BadRequestException("Vui lòng chọn ngày đăng ký nghỉ phép");
        }
        LocalDate date = LocalDate.parse(dateStr);

        Optional<ArtistSchedule> existingOpt = artistScheduleRepository.findByMakeupArtistIdAndScheduleDate(artist.getId(), date);
        ArtistSchedule schedule;

        if (existingOpt.isPresent()) {
            schedule = existingOpt.get();
            schedule.setIsDayOff(true);
        } else {
            schedule = ArtistSchedule.builder()
                    .makeupArtist(artist)
                    .scheduleDate(date)
                    .startTime(LocalTime.of(8, 0))
                    .endTime(LocalTime.of(20, 0))
                    .isDayOff(true)
                    .build();
        }

        ArtistSchedule saved = artistScheduleRepository.save(schedule);
        log.info("Thợ {} (ID: {}) đã đăng ký nghỉ phép ngày {}", artist.getUser().getFullName(), artist.getId(), date);

        return ApiResponse.success("Đăng ký ngày nghỉ phép thành công. Hệ thống đã khóa lịch nhận khách ngày " + date, saved);
    }

    /**
     * 4. Xem thông tin hồ sơ nghệ sĩ
     */
    @GetMapping("/profile")
    @Transactional(readOnly = true)
    public ApiResponse<Map<String, Object>> getProfile(@AuthenticationPrincipal UserPrincipal currentUser) {
        MakeupArtist artist = getArtistFromPrincipal(currentUser);

        Map<String, Object> map = new HashMap<>();
        map.put("artistId", artist.getId());
        map.put("userId", artist.getUser().getId());
        map.put("fullName", artist.getUser().getFullName());
        map.put("email", artist.getUser().getEmail());
        map.put("phone", artist.getUser().getPhone());
        map.put("avatar", artist.getUser().getAvatar());
        map.put("experience", artist.getExperience());
        map.put("specialties", artist.getSpecialties());
        map.put("workingHours", artist.getWorkingHours());
        map.put("workingDays", artist.getWorkingDays());
        map.put("active", artist.getActive());

        return ApiResponse.success("Lấy hồ sơ cá nhân nghệ sĩ thành công", map);
    }

    /**
     * 5. Cập nhật hồ sơ cá nhân và chuyên môn của thợ
     */
    @PutMapping("/profile")
    @Transactional
    public ApiResponse<Map<String, Object>> updateProfile(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @RequestBody Map<String, Object> body
    ) {
        MakeupArtist artist = getArtistFromPrincipal(currentUser);
        User user = artist.getUser();

        if (user != null) {
            if (body.containsKey("fullName") && body.get("fullName") != null) {
                user.setFullName(body.get("fullName").toString().trim());
            }
            if (body.containsKey("phone") && body.get("phone") != null) {
                user.setPhone(body.get("phone").toString().trim());
            }
            if (body.containsKey("avatar")) {
                user.setAvatar(body.get("avatar") != null ? body.get("avatar").toString().trim() : null);
            }
            userRepository.save(user);
        }

        if (body.containsKey("experience")) artist.setExperience((String) body.get("experience"));
        if (body.containsKey("specialties")) artist.setSpecialties((String) body.get("specialties"));
        if (body.containsKey("workingHours")) artist.setWorkingHours((String) body.get("workingHours"));
        if (body.containsKey("workingDays")) artist.setWorkingDays((String) body.get("workingDays"));
        if (body.containsKey("active") && body.get("active") != null) {
            artist.setActive(Boolean.valueOf(body.get("active").toString()));
        }

        makeupArtistRepository.save(artist);
        return getProfile(currentUser);
    }

    /**
     * 6. Nghệ sĩ lấy danh sách các tác phẩm trong bộ sưu tập của mình
     */
    @GetMapping("/portfolios")
    public ApiResponse<List<PortfolioResponse>> getMyPortfolios(@AuthenticationPrincipal UserPrincipal currentUser) {
        List<PortfolioResponse> list = portfolioService.getMyPortfolios(currentUser);
        return ApiResponse.success("Lấy danh sách bộ sưu tập của nghệ sĩ thành công", list);
    }

    /**
     * 7. Nghệ sĩ đăng tải tác phẩm mới lên bộ sưu tập
     */
    @PostMapping("/portfolios")
    public ApiResponse<PortfolioResponse> createPortfolio(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @Valid @RequestBody PortfolioCreateRequest request
    ) {
        PortfolioResponse created = portfolioService.createPortfolio(currentUser, request);
        return ApiResponse.success("Đăng tác phẩm lên bộ sưu tập thành công", created);
    }

    /**
     * 8. Nghệ sĩ cập nhật tác phẩm trong bộ sưu tập
     */
    @PutMapping("/portfolios/{id}")
    public ApiResponse<PortfolioResponse> updatePortfolio(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable Long id,
            @Valid @RequestBody PortfolioCreateRequest request
    ) {
        PortfolioResponse updated = portfolioService.updatePortfolio(currentUser, id, request);
        return ApiResponse.success("Cập nhật tác phẩm thành công", updated);
    }

    /**
     * 9. Nghệ sĩ xóa tác phẩm khỏi bộ sưu tập
     */
    @DeleteMapping("/portfolios/{id}")
    public ApiResponse<Void> deletePortfolio(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable Long id
    ) {
        portfolioService.deletePortfolio(currentUser, id);
        return ApiResponse.success("Xóa tác phẩm khỏi bộ sưu tập thành công", null);
    }
}

