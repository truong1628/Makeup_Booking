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

import com.bookingmakeup.entity.ArtistSchedule;
import com.bookingmakeup.entity.Booking;
import com.bookingmakeup.entity.BookingItem;
import com.bookingmakeup.enums.BookingStatus;
import com.bookingmakeup.repository.ArtistScheduleRepository;
import com.bookingmakeup.repository.BookingRepository;
import org.springframework.format.annotation.DateTimeFormat;
import java.math.BigDecimal;
import java.util.stream.Collectors;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Optional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
@PreAuthorize("hasAuthority('ROLE_ADMIN')")
public class AdminController {

    private final AuthService authService;
    private final MakeupArtistRepository makeupArtistRepository;
    private final UserRepository userRepository;
    private final BookingItemRepository bookingItemRepository;
    private final BookingRepository bookingRepository;
    private final PasswordEncoder passwordEncoder;
    private final ArtistScheduleRepository artistScheduleRepository;

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

    /**
     * Admin lấy danh sách lịch làm việc và ngày nghỉ của các chuyên viên
     */
    @GetMapping("/schedules")
    @Transactional(readOnly = true)
    public ApiResponse<List<Map<String, Object>>> getAllSchedules(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate
    ) {
        List<ArtistSchedule> schedules;
        if (startDate != null && endDate != null) {
            schedules = artistScheduleRepository.findByScheduleDateBetweenOrderByScheduleDateAsc(startDate, endDate);
        } else {
            schedules = artistScheduleRepository.findAll();
        }

        List<Map<String, Object>> response = schedules.stream().map(s -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", s.getId());
            map.put("artistId", s.getMakeupArtist() != null ? s.getMakeupArtist().getId() : null);
            map.put("artistName", (s.getMakeupArtist() != null && s.getMakeupArtist().getUser() != null)
                    ? s.getMakeupArtist().getUser().getFullName() : "Chuyên viên");
            map.put("scheduleDate", s.getScheduleDate());
            map.put("startTime", s.getStartTime() != null ? s.getStartTime().toString() : "08:00:00");
            map.put("endTime", s.getEndTime() != null ? s.getEndTime().toString() : "20:00:00");
            map.put("isDayOff", s.getIsDayOff() != null ? s.getIsDayOff() : false);
            return map;
        }).toList();

        return ApiResponse.success("Lấy danh sách lịch làm việc thành công", response);
    }

    /**
     * Admin đánh dấu ngày nghỉ hoặc cập nhật lịch làm việc cho chuyên viên
     */
    @PostMapping("/schedules/day-off")
    @Transactional
    public ApiResponse<Map<String, Object>> toggleDayOff(@RequestBody Map<String, Object> body) {
        if (!body.containsKey("artistId") || !body.containsKey("scheduleDate")) {
            throw new BadRequestException("Thiếu artistId hoặc scheduleDate");
        }

        Long artistId = Long.valueOf(body.get("artistId").toString());
        LocalDate date = LocalDate.parse(body.get("scheduleDate").toString());
        Boolean isDayOff = body.containsKey("isDayOff") ? Boolean.valueOf(body.get("isDayOff").toString()) : true;

        MakeupArtist artist = makeupArtistRepository.findById(artistId)
                .orElseThrow(() -> new ResourceNotFoundException("MakeupArtist", "id", artistId));

        Optional<ArtistSchedule> opt = artistScheduleRepository.findByMakeupArtistIdAndScheduleDate(artistId, date);
        ArtistSchedule schedule;
        if (opt.isPresent()) {
            schedule = opt.get();
            schedule.setIsDayOff(isDayOff);
            if (body.containsKey("startTime") && body.get("startTime") != null) {
                schedule.setStartTime(LocalTime.parse(body.get("startTime").toString()));
            }
            if (body.containsKey("endTime") && body.get("endTime") != null) {
                schedule.setEndTime(LocalTime.parse(body.get("endTime").toString()));
            }
        } else {
            LocalTime startTime = body.containsKey("startTime") && body.get("startTime") != null
                    ? LocalTime.parse(body.get("startTime").toString()) : LocalTime.of(8, 0);
            LocalTime endTime = body.containsKey("endTime") && body.get("endTime") != null
                    ? LocalTime.parse(body.get("endTime").toString()) : LocalTime.of(20, 0);

            schedule = ArtistSchedule.builder()
                    .makeupArtist(artist)
                    .scheduleDate(date)
                    .startTime(startTime)
                    .endTime(endTime)
                    .isDayOff(isDayOff)
                    .build();
        }

        ArtistSchedule saved = artistScheduleRepository.save(schedule);

        Map<String, Object> map = new HashMap<>();
        map.put("id", saved.getId());
        map.put("artistId", artist.getId());
        map.put("artistName", artist.getUser() != null ? artist.getUser().getFullName() : "");
        map.put("scheduleDate", saved.getScheduleDate());
        map.put("startTime", saved.getStartTime().toString());
        map.put("endTime", saved.getEndTime().toString());
        map.put("isDayOff", saved.getIsDayOff());

        return ApiResponse.success(isDayOff ? "Đã đánh dấu ngày nghỉ cho chuyên viên" : "Đã chuyển sang ca làm việc bình thường", map);
    }

    /**
     * Admin xóa bản ghi lịch biểu
     */
    @DeleteMapping("/schedules/{id}")
    @Transactional
    public ApiResponse<Void> deleteSchedule(@PathVariable Long id) {
        if (!artistScheduleRepository.existsById(id)) {
            throw new ResourceNotFoundException("ArtistSchedule", "id", id);
        }
        artistScheduleRepository.deleteById(id);
        return ApiResponse.success("Đã xóa lịch làm việc thành công", null);
    }

    /**
     * Admin lấy bảng thống kê số tiền và năng suất từng chuyên viên kiếm được
     */
    @GetMapping("/artists/revenue-statistics")
    @Transactional(readOnly = true)
    public ApiResponse<Map<String, Object>> getArtistRevenueStatistics(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate
    ) {
        List<MakeupArtist> artists = makeupArtistRepository.findAllWithUser();
        List<BookingItem> allItems = bookingItemRepository.findAllWithDetails();

        // Lọc theo khoảng ngày nếu có và loại bỏ đơn PENDING_PAYMENT
        List<BookingItem> filteredItems = allItems.stream()
                .filter(item -> {
                    if (item.getBooking() == null) return false;
                    if (item.getBooking().getStatus() == BookingStatus.PENDING_PAYMENT) return false;
                    LocalDate d = item.getBooking().getBookingDate();
                    if (startDate != null && d.isBefore(startDate)) return false;
                    if (endDate != null && d.isAfter(endDate)) return false;
                    return true;
                })
                .collect(Collectors.toList());

        BigDecimal salonTotalRevenue = BigDecimal.ZERO;
        BigDecimal salonCompletedRevenue = BigDecimal.ZERO;
        int salonTotalAppointments = 0;

        List<Map<String, Object>> artistStatsList = new ArrayList<>();

        for (MakeupArtist artist : artists) {
            Long artistId = artist.getId();
            List<BookingItem> artistItems = filteredItems.stream()
                    .filter(i -> i.getMakeupArtist() != null && i.getMakeupArtist().getId().equals(artistId))
                    .collect(Collectors.toList());

            BigDecimal totalRevenue = BigDecimal.ZERO;
            BigDecimal completedRevenue = BigDecimal.ZERO;
            BigDecimal pendingRevenue = BigDecimal.ZERO;
            int completedCount = 0;
            int inProgressCount = 0;
            int cancelledCount = 0;
            int totalValidCount = 0;

            List<Map<String, Object>> itemDetails = new ArrayList<>();

            for (BookingItem item : artistItems) {
                BookingStatus status = item.getBooking().getStatus();
                BigDecimal price = item.getPrice() != null ? item.getPrice() : BigDecimal.ZERO;

                Map<String, Object> itemMap = new HashMap<>();
                itemMap.put("itemId", item.getId());
                itemMap.put("bookingId", item.getBooking().getId());
                itemMap.put("bookingDate", item.getBooking().getBookingDate());
                itemMap.put("bookingTime", item.getBooking().getBookingTime() != null ? item.getBooking().getBookingTime().toString() : "");
                itemMap.put("startTime", item.getStartTime() != null ? item.getStartTime().toString() : "");
                itemMap.put("endTime", item.getEndTime() != null ? item.getEndTime().toString() : "");
                itemMap.put("serviceName", item.getMakeupService() != null ? item.getMakeupService().getServiceName() : "Dịch vụ");
                itemMap.put("price", price);
                itemMap.put("status", status != null ? status.name() : "");
                itemMap.put("customerName", item.getBooking().getUser() != null ? item.getBooking().getUser().getFullName() : "Khách hàng");
                itemMap.put("customerPhone", item.getBooking().getUser() != null ? item.getBooking().getUser().getPhone() : "");
                itemDetails.add(itemMap);

                if (status == BookingStatus.CANCELLED) {
                    cancelledCount++;
                } else {
                    totalValidCount++;
                    totalRevenue = totalRevenue.add(price);

                    if (status == BookingStatus.COMPLETED) {
                        completedCount++;
                        completedRevenue = completedRevenue.add(price);
                    } else {
                        inProgressCount++;
                        pendingRevenue = pendingRevenue.add(price);
                    }
                }
            }

            salonTotalRevenue = salonTotalRevenue.add(totalRevenue);
            salonCompletedRevenue = salonCompletedRevenue.add(completedRevenue);
            salonTotalAppointments += totalValidCount;

            double completionRate = totalValidCount > 0
                    ? ((double) completedCount / totalValidCount) * 100.0
                    : 0.0;

            Map<String, Object> statMap = new HashMap<>();
            statMap.put("artistId", artist.getId());
            statMap.put("fullName", artist.getUser() != null ? artist.getUser().getFullName() : "Chuyên viên");
            statMap.put("email", artist.getUser() != null ? artist.getUser().getEmail() : "");
            statMap.put("phone", artist.getUser() != null ? artist.getUser().getPhone() : "");
            statMap.put("avatar", artist.getUser() != null ? artist.getUser().getAvatar() : null);
            statMap.put("experience", artist.getExperience());
            statMap.put("active", artist.getActive() != null ? artist.getActive() : true);
            statMap.put("totalAppointments", totalValidCount);
            statMap.put("completedAppointments", completedCount);
            statMap.put("inProgressAppointments", inProgressCount);
            statMap.put("cancelledAppointments", cancelledCount);
            statMap.put("totalRevenue", totalRevenue);
            statMap.put("completedRevenue", completedRevenue);
            statMap.put("pendingRevenue", pendingRevenue);
            statMap.put("completionRate", Math.round(completionRate * 10.0) / 10.0);
            statMap.put("items", itemDetails);

            artistStatsList.add(statMap);
        }

        // Tính tỷ trọng doanh thu (% contribution) và sắp xếp theo doanh thu giảm dần
        final BigDecimal finalSalonRevenue = salonTotalRevenue;
        artistStatsList.forEach(m -> {
            BigDecimal rev = (BigDecimal) m.get("totalRevenue");
            double share = (finalSalonRevenue.compareTo(BigDecimal.ZERO) > 0 && rev != null)
                    ? rev.divide(finalSalonRevenue, 4, RoundingMode.HALF_UP).doubleValue() * 100.0
                    : 0.0;
            m.put("revenueShare", Math.round(share * 10.0) / 10.0);
        });

        artistStatsList.sort((a, b) -> {
            BigDecimal r1 = (BigDecimal) a.get("totalRevenue");
            BigDecimal r2 = (BigDecimal) b.get("totalRevenue");
            return r2.compareTo(r1);
        });

        Map<String, Object> responseData = new HashMap<>();
        responseData.put("artists", artistStatsList);
        responseData.put("salonTotalRevenue", salonTotalRevenue);
        responseData.put("salonCompletedRevenue", salonCompletedRevenue);
        responseData.put("salonTotalAppointments", salonTotalAppointments);
        responseData.put("totalArtists", artists.size());

        return ApiResponse.success("Lấy bảng thống kê doanh thu chuyên viên thành công", responseData);
    }

    /**
     * Admin lấy danh sách các ca làm việc có yêu cầu hủy / đổi thợ
     */
    @GetMapping("/cancellation-requests")
    @Transactional(readOnly = true)
    public ApiResponse<List<Map<String, Object>>> getCancellationRequests(
            @RequestParam(required = false, defaultValue = "PENDING") String status) {
        
        List<BookingItem> items = "ALL".equalsIgnoreCase(status)
                ? bookingItemRepository.findAllCancellationRequests()
                : bookingItemRepository.findPendingCancellationRequests();

        List<MakeupArtist> allArtists = makeupArtistRepository.findAllWithUser();

        List<Map<String, Object>> response = items.stream().map(item -> {
            Booking booking = item.getBooking();
            Map<String, Object> map = new HashMap<>();
            map.put("itemId", item.getId());
            map.put("bookingId", booking != null ? booking.getId() : null);
            map.put("bookingCode", booking != null ? "#" + booking.getId() : null);
            map.put("customerName", (booking != null && booking.getUser() != null) ? booking.getUser().getFullName() : "Khách hàng");
            map.put("customerPhone", (booking != null && booking.getUser() != null) ? booking.getUser().getPhone() : "");
            map.put("serviceName", item.getMakeupService() != null ? item.getMakeupService().getServiceName() : "Dịch vụ");
            map.put("price", item.getPrice());
            map.put("bookingDate", booking != null ? booking.getBookingDate() : null);
            map.put("startTime", item.getStartTime());
            map.put("endTime", item.getEndTime());
            map.put("bookingStatus", booking != null ? booking.getStatus().name() : null);
            
            MakeupArtist currentArtist = item.getMakeupArtist();
            map.put("currentArtistId", currentArtist != null ? currentArtist.getId() : null);
            map.put("currentArtistName", currentArtist != null && currentArtist.getUser() != null ? currentArtist.getUser().getFullName() : "N/A");
            map.put("currentArtistPhone", currentArtist != null && currentArtist.getUser() != null ? currentArtist.getUser().getPhone() : "");
            
            map.put("cancelRequested", item.getCancelRequested());
            map.put("cancelReason", item.getCancelReason());
            map.put("cancelRequestedAt", item.getCancelRequestedAt());
            map.put("cancelStatus", item.getCancelStatus());
            map.put("originalArtistId", item.getOriginalArtistId());

            // Danh sách thợ có thể nhận ca (Active, không phải thợ hiện tại, không trùng lịch)
            List<Map<String, Object>> availableArtists = new ArrayList<>();
            if (booking != null && item.getStartTime() != null && item.getEndTime() != null) {
                for (MakeupArtist artist : allArtists) {
                    if (artist.getActive() != null && !artist.getActive()) {
                        continue;
                    }
                    if (currentArtist != null && artist.getId().equals(currentArtist.getId())) {
                        continue;
                    }
                    // Kiểm tra xem thợ này có ca trùng không
                    List<BookingItem> overlaps = bookingItemRepository.findOverlappingItems(
                            artist.getId(), booking.getBookingDate(), item.getStartTime(), item.getEndTime());
                    if (overlaps.isEmpty()) {
                        Map<String, Object> aMap = new HashMap<>();
                        aMap.put("id", artist.getId());
                        aMap.put("fullName", artist.getUser() != null ? artist.getUser().getFullName() : "N/A");
                        aMap.put("phone", artist.getUser() != null ? artist.getUser().getPhone() : "");
                        aMap.put("experience", artist.getExperience());
                        availableArtists.add(aMap);
                    }
                }
            }
            map.put("availableArtists", availableArtists);
            return map;
        }).collect(Collectors.toList());

        return ApiResponse.success("Lấy danh sách yêu cầu hủy ca thành công", response);
    }

    /**
     * Admin duyệt yêu cầu hủy ca và chuyển sang cho thợ trang điểm khác
     */
    @PostMapping("/cancellation-requests/{itemId}/approve")
    @Transactional
    public ApiResponse<Map<String, Object>> approveCancellationRequest(
            @PathVariable Long itemId,
            @RequestBody Map<String, Object> body) {
        
        BookingItem item = bookingItemRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy ca làm việc với ID: " + itemId));

        if (!Boolean.TRUE.equals(item.getCancelRequested()) || !"PENDING".equalsIgnoreCase(item.getCancelStatus())) {
            throw new BadRequestException("Ca làm việc này không có yêu cầu hủy đang chờ duyệt.");
        }

        Object newArtistIdObj = body.get("newArtistId");
        if (newArtistIdObj == null) {
            throw new BadRequestException("Vui lòng chọn thợ trang điểm mới để thay thế.");
        }
        Long newArtistId = Long.valueOf(newArtistIdObj.toString());
        String adminNote = body.get("adminNote") != null ? body.get("adminNote").toString().trim() : "";

        MakeupArtist newArtist = makeupArtistRepository.findById(newArtistId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thợ trang điểm mới với ID: " + newArtistId));

        if (newArtist.getActive() != null && !newArtist.getActive()) {
            throw new BadRequestException("Thợ trang điểm được chọn hiện đang tạm ngưng hoạt động.");
        }

        if (item.getMakeupArtist() != null && item.getMakeupArtist().getId().equals(newArtistId)) {
            throw new BadRequestException("Không thể gán lại ca cho chính thợ vừa yêu cầu hủy.");
        }

        Booking booking = item.getBooking();
        if (booking != null && item.getStartTime() != null && item.getEndTime() != null) {
            List<BookingItem> overlaps = bookingItemRepository.findOverlappingItems(
                    newArtist.getId(), booking.getBookingDate(), item.getStartTime(), item.getEndTime());
            if (!overlaps.isEmpty()) {
                throw new BadRequestException("Thợ được chọn đã bị trùng lịch trong khung giờ này.");
            }
        }

        MakeupArtist oldArtist = item.getMakeupArtist();
        String oldArtistName = (oldArtist != null && oldArtist.getUser() != null) ? oldArtist.getUser().getFullName() : "N/A";
        String newArtistName = (newArtist.getUser() != null) ? newArtist.getUser().getFullName() : "N/A";

        // Cập nhật trạng thái item
        item.setOriginalArtistId(oldArtist != null ? oldArtist.getId() : null);
        item.setMakeupArtist(newArtist);
        item.setCancelRequested(false);
        item.setCancelStatus("APPROVED");

        // Ghi lại lịch sử vào booking notes
        if (booking != null) {
            String historyLog = String.format("[Đổi thợ %s]: Thợ cũ %s xin hủy (Lý do: %s). Đã chuyển sang thợ %s. Ghi chú admin: %s",
                    LocalDate.now(), oldArtistName, item.getCancelReason() != null ? item.getCancelReason() : "Không ghi rõ",
                    newArtistName, !adminNote.isEmpty() ? adminNote : "Không có");
            String existingNotes = booking.getNotes();
            booking.setNotes(existingNotes != null && !existingNotes.isBlank()
                    ? existingNotes + "\n" + historyLog
                    : historyLog);
            bookingRepository.save(booking);
        }

        bookingItemRepository.save(item);

        Map<String, Object> result = new HashMap<>();
        result.put("itemId", item.getId());
        result.put("newArtistId", newArtist.getId());
        result.put("newArtistName", newArtistName);
        result.put("status", "APPROVED");

        return ApiResponse.success("Đã duyệt yêu cầu hủy ca và chuyển giao thành công cho thợ " + newArtistName, result);
    }

    /**
     * Admin từ chối yêu cầu hủy ca của thợ
     */
    @PostMapping("/cancellation-requests/{itemId}/reject")
    @Transactional
    public ApiResponse<Map<String, Object>> rejectCancellationRequest(
            @PathVariable Long itemId,
            @RequestBody(required = false) Map<String, Object> body) {

        BookingItem item = bookingItemRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy ca làm việc với ID: " + itemId));

        if (!Boolean.TRUE.equals(item.getCancelRequested()) || !"PENDING".equalsIgnoreCase(item.getCancelStatus())) {
            throw new BadRequestException("Ca làm việc này không có yêu cầu hủy đang chờ duyệt.");
        }

        String adminNote = (body != null && body.get("adminNote") != null) ? body.get("adminNote").toString().trim() : "";

        item.setCancelRequested(false);
        item.setCancelStatus("REJECTED");

        Booking booking = item.getBooking();
        if (booking != null && !adminNote.isEmpty()) {
            MakeupArtist artist = item.getMakeupArtist();
            String artistName = (artist != null && artist.getUser() != null) ? artist.getUser().getFullName() : "N/A";
            String historyLog = String.format("[Từ chối hủy ca %s]: Admin từ chối yêu cầu hủy của thợ %s. Ghi chú: %s",
                    LocalDate.now(), artistName, adminNote);
            String existingNotes = booking.getNotes();
            booking.setNotes(existingNotes != null && !existingNotes.isBlank()
                    ? existingNotes + "\n" + historyLog
                    : historyLog);
            bookingRepository.save(booking);
        }

        bookingItemRepository.save(item);

        Map<String, Object> result = new HashMap<>();
        result.put("itemId", item.getId());
        result.put("status", "REJECTED");

        return ApiResponse.success("Đã từ chối yêu cầu hủy ca của thợ", result);
    }

    /**
     * Admin lấy danh sách thợ trang điểm khả dụng cho một ca làm việc (BookingItem)
     */
    @GetMapping("/bookings/items/{itemId}/available-artists")
    @Transactional(readOnly = true)
    public ApiResponse<List<Map<String, Object>>> getAvailableArtistsForItem(@PathVariable Long itemId) {
        BookingItem item = bookingItemRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy ca làm việc với ID: " + itemId));

        Booking booking = item.getBooking();
        List<MakeupArtist> allArtists = makeupArtistRepository.findAllWithUser();
        Long currentArtistId = item.getMakeupArtist() != null ? item.getMakeupArtist().getId() : null;

        List<Map<String, Object>> response = new ArrayList<>();
        for (MakeupArtist artist : allArtists) {
            if (artist.getActive() != null && !artist.getActive()) {
                continue;
            }

            boolean isCurrent = currentArtistId != null && currentArtistId.equals(artist.getId());
            boolean isAvailable = true;
            String overlapMessage = null;

            if (booking != null && item.getStartTime() != null && item.getEndTime() != null) {
                List<BookingItem> overlaps = bookingItemRepository.findOverlappingItems(
                        artist.getId(), booking.getBookingDate(), item.getStartTime(), item.getEndTime());
                
                // Loại trừ chính item hiện tại nếu thợ đó đang phụ trách
                List<BookingItem> otherOverlaps = overlaps.stream()
                        .filter(ov -> !ov.getId().equals(item.getId()))
                        .toList();

                if (!otherOverlaps.isEmpty()) {
                    isAvailable = false;
                    overlapMessage = "Đang có " + otherOverlaps.size() + " ca khác trong khung giờ này";
                }
            }

            Map<String, Object> map = new HashMap<>();
            map.put("id", artist.getId());
            map.put("fullName", artist.getUser() != null ? artist.getUser().getFullName() : "N/A");
            map.put("phone", artist.getUser() != null ? artist.getUser().getPhone() : "");
            map.put("experience", artist.getExperience());
            map.put("isCurrent", isCurrent);
            map.put("isAvailable", isAvailable);
            map.put("overlapMessage", overlapMessage);

            response.add(map);
        }

        // Sắp xếp: Thợ hiện tại lên đầu hoặc thợ rảnh lên trước
        response.sort((a, b) -> {
            boolean aCur = Boolean.TRUE.equals(a.get("isCurrent"));
            boolean bCur = Boolean.TRUE.equals(b.get("isCurrent"));
            if (aCur != bCur) return aCur ? -1 : 1;
            boolean aAvail = Boolean.TRUE.equals(a.get("isAvailable"));
            boolean bAvail = Boolean.TRUE.equals(b.get("isAvailable"));
            return Boolean.compare(bAvail, aAvail);
        });

        return ApiResponse.success("Lấy danh sách thợ khả dụng thành công", response);
    }

    /**
     * Admin chủ động thay đổi / phân công lại thợ trang điểm cho một ca làm việc
     */
    @PostMapping("/bookings/items/{itemId}/reassign-artist")
    @Transactional
    public ApiResponse<Map<String, Object>> reassignArtistForItem(
            @PathVariable Long itemId,
            @RequestBody Map<String, Object> body) {

        BookingItem item = bookingItemRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy ca làm việc với ID: " + itemId));

        Booking booking = item.getBooking();
        if (booking != null) {
            if (booking.getStatus() == BookingStatus.CANCELLED) {
                throw new BadRequestException("Không thể đổi thợ cho đơn đặt lịch đã bị hủy.");
            }
            if (booking.getStatus() == BookingStatus.COMPLETED) {
                throw new BadRequestException("Không thể đổi thợ cho đơn đặt lịch đã hoàn thành.");
            }
        }

        Object newArtistIdObj = body.get("newArtistId");
        if (newArtistIdObj == null) {
            throw new BadRequestException("Vui lòng chọn thợ trang điểm mới.");
        }
        Long newArtistId = Long.valueOf(newArtistIdObj.toString());
        String adminNote = body.get("adminNote") != null ? body.get("adminNote").toString().trim() : "";

        MakeupArtist newArtist = makeupArtistRepository.findById(newArtistId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thợ trang điểm mới với ID: " + newArtistId));

        if (newArtist.getActive() != null && !newArtist.getActive()) {
            throw new BadRequestException("Thợ trang điểm được chọn hiện đang tạm ngưng hoạt động.");
        }

        if (item.getMakeupArtist() != null && item.getMakeupArtist().getId().equals(newArtistId)) {
            throw new BadRequestException("Thợ được chọn hiện đang là người phụ trách ca này.");
        }

        // Kiểm tra trùng lịch
        if (booking != null && item.getStartTime() != null && item.getEndTime() != null) {
            List<BookingItem> overlaps = bookingItemRepository.findOverlappingItems(
                    newArtist.getId(), booking.getBookingDate(), item.getStartTime(), item.getEndTime());
            List<BookingItem> conflictItems = overlaps.stream()
                    .filter(ov -> !ov.getId().equals(item.getId()))
                    .toList();
            if (!conflictItems.isEmpty()) {
                throw new BadRequestException("Thợ " + (newArtist.getUser() != null ? newArtist.getUser().getFullName() : "") + " đã bị trùng lịch với ca khác trong khung giờ này.");
            }
        }

        MakeupArtist oldArtist = item.getMakeupArtist();
        String oldArtistName = (oldArtist != null && oldArtist.getUser() != null) ? oldArtist.getUser().getFullName() : "Chưa phân công";
        String newArtistName = (newArtist.getUser() != null) ? newArtist.getUser().getFullName() : "N/A";
        String serviceName = item.getMakeupService() != null ? item.getMakeupService().getServiceName() : "Dịch vụ";

        item.setOriginalArtistId(oldArtist != null ? oldArtist.getId() : null);
        item.setMakeupArtist(newArtist);

        // Nếu ca này đang có yêu cầu hủy PENDING, tự động đánh dấu APPROVED
        if (Boolean.TRUE.equals(item.getCancelRequested())) {
            item.setCancelRequested(false);
            item.setCancelStatus("APPROVED");
        }

        if (booking != null) {
            String historyLog = String.format("[Admin đổi thợ %s]: Chuyển ca '%s' (%s - %s) từ thợ '%s' sang thợ '%s'. Ghi chú: %s",
                    LocalDate.now(), serviceName, item.getStartTime(), item.getEndTime(),
                    oldArtistName, newArtistName, !adminNote.isEmpty() ? adminNote : "Admin chủ động phân công lại");
            String existingNotes = booking.getNotes();
            booking.setNotes(existingNotes != null && !existingNotes.isBlank()
                    ? existingNotes + "\n" + historyLog
                    : historyLog);
            bookingRepository.save(booking);
        }

        bookingItemRepository.save(item);

        Map<String, Object> result = new HashMap<>();
        result.put("itemId", item.getId());
        result.put("bookingId", booking != null ? booking.getId() : null);
        result.put("newArtistId", newArtist.getId());
        result.put("newArtistName", newArtistName);
        result.put("oldArtistName", oldArtistName);

        return ApiResponse.success("Đã đổi thợ thành công sang chuyên viên " + newArtistName, result);
    }
}

