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

import com.bookingmakeup.entity.Booking;
import com.bookingmakeup.entity.Payment;
import com.bookingmakeup.enums.PaymentMethod;
import com.bookingmakeup.enums.PaymentStatus;
import com.bookingmakeup.repository.BookingRepository;
import com.bookingmakeup.repository.PaymentRepository;
import java.math.BigDecimal;

import com.bookingmakeup.service.BookingService;

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
    private final BookingService bookingService;
    private final BookingRepository bookingRepository;
    private final PaymentRepository paymentRepository;

    private MakeupArtist getArtistFromPrincipal(UserPrincipal currentUser) {
        return makeupArtistRepository.findByUserId(currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("MakeupArtist", "userId", currentUser.getId()));
    }

    /**
     * Cập nhật trạng thái ca làm việc (Chuyên gia bắt đầu thực hiện / hoàn thành)
     */
    @PatchMapping("/assignments/{bookingId}/status")
    public ApiResponse<Map<String, Object>> updateAssignmentStatus(
            @PathVariable Long bookingId,
            @RequestParam com.bookingmakeup.enums.BookingStatus status,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        log.info("Artist {} cập nhật trạng thái đơn đặt lịch ID: {} sang {}", currentUser.getId(), bookingId, status);

        if (status == com.bookingmakeup.enums.BookingStatus.COMPLETED) {
            Booking booking = bookingRepository.findById(bookingId)
                    .orElseThrow(() -> new ResourceNotFoundException("Booking", "id", bookingId));

            List<Payment> payments = paymentRepository.findByBookingId(bookingId);
            BigDecimal totalPaid = BigDecimal.ZERO;
            for (Payment p : payments) {
                if (p.getStatus() == PaymentStatus.PAID) {
                    totalPaid = totalPaid.add(p.getAmount() != null ? p.getAmount() : BigDecimal.ZERO);
                }
            }

            BigDecimal totalPrice = booking.getTotalPrice() != null ? booking.getTotalPrice() : BigDecimal.ZERO;
            boolean hasCollectedNote = booking.getNotes() != null && booking.getNotes().contains("[ĐÃ THU ĐỦ TIỀN");
            boolean isFullyPaid = hasCollectedNote || totalPaid.compareTo(totalPrice) >= 0;

            if (!isFullyPaid) {
                throw new BadRequestException("Bạn phải bấm xác nhận 'Đã Thu Tiền' từ khách hàng trước khi hoàn thành ca làm việc!");
            }
        }

        bookingService.updateBookingStatus(bookingId, status);
        Map<String, Object> map = new HashMap<>();
        map.put("bookingId", bookingId);
        map.put("status", status);
        return ApiResponse.success("Cập nhật trạng thái ca làm việc thành công", map);
    }

    /**
     * Chuyên gia xác nhận đã thu tiền từ khách hàng
     */
    @PostMapping("/assignments/{bookingId}/collect-payment")
    @Transactional
    public ApiResponse<Map<String, Object>> collectPayment(
            @PathVariable Long bookingId,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        log.info("Artist {} xác nhận đã thu tiền cho đơn đặt lịch ID: {}", currentUser.getId(), bookingId);
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking", "id", bookingId));

        List<Payment> payments = paymentRepository.findByBookingId(bookingId);
        BigDecimal totalPaid = BigDecimal.ZERO;
        for (Payment p : payments) {
            if (p.getStatus() == PaymentStatus.PAID) {
                totalPaid = totalPaid.add(p.getAmount() != null ? p.getAmount() : BigDecimal.ZERO);
            }
        }

        BigDecimal totalPrice = booking.getTotalPrice() != null ? booking.getTotalPrice() : BigDecimal.ZERO;
        BigDecimal remaining = totalPrice.subtract(totalPaid).max(BigDecimal.ZERO);

        if (remaining.compareTo(BigDecimal.ZERO) > 0) {
            Payment cashPayment = Payment.builder()
                    .booking(booking)
                    .amount(remaining)
                    .paymentMethod(PaymentMethod.CASH)
                    .status(PaymentStatus.PAID)
                    .transactionCode("ARTIST_COLLECTED_" + bookingId + "_" + System.currentTimeMillis())
                    .paymentDate(java.time.LocalDateTime.now())
                    .build();
            paymentRepository.save(cashPayment);
        }

        String currentNotes = booking.getNotes() != null ? booking.getNotes() : "";
        if (!currentNotes.contains("[ĐÃ THU ĐỦ TIỀN]")) {
            booking.setNotes(("[ĐÃ THU ĐỦ TIỀN] " + currentNotes).trim());
            bookingRepository.save(booking);
        }

        Map<String, Object> result = new HashMap<>();
        result.put("bookingId", bookingId);
        result.put("isFullyPaid", true);
        result.put("collectedAmount", remaining);
        return ApiResponse.success("Đã ghi nhận thu tiền thành công!", result);
    }

    /**
     * 1. Thợ lấy danh sách các ca làm việc (Assignments) được phân bổ cho mình
     */
    @GetMapping("/assignments")
    @Transactional(readOnly = true)
    public ApiResponse<List<Map<String, Object>>> getMyAssignments(@AuthenticationPrincipal UserPrincipal currentUser) {
        MakeupArtist artist = getArtistFromPrincipal(currentUser);
        List<BookingItem> items = bookingItemRepository.findByArtistIdOrderByDateAndTime(artist.getId());

        // Chỉ hiển thị các đơn đã cọc hoặc thanh toán tại studio (loại bỏ đơn chờ cọc PENDING_PAYMENT)
        List<Map<String, Object>> result = items.stream()
                .filter(item -> item.getBooking() != null && item.getBooking().getStatus() != com.bookingmakeup.enums.BookingStatus.PENDING_PAYMENT)
                .map(item -> {
            Booking booking = item.getBooking();
            Map<String, Object> map = new HashMap<>();
            map.put("itemId", item.getId());
            map.put("bookingId", booking.getId());
            map.put("bookingDate", booking.getBookingDate());
            map.put("startTime", item.getStartTime());
            map.put("endTime", item.getEndTime());
            map.put("serviceName", item.getMakeupService().getServiceName());
            map.put("duration", item.getMakeupService().getDuration());
            map.put("price", item.getPrice());
            map.put("bookingStatus", booking.getStatus());
            map.put("locationType", booking.getLocationType());
            map.put("executionMode", booking.getExecutionMode());
            map.put("totalPrice", booking.getTotalPrice());
            map.put("depositAmount", booking.getDepositAmount());

            // Thông tin thanh toán & số tiền cần thu
            List<Payment> payments = paymentRepository.findByBookingId(booking.getId());
            BigDecimal totalPaid = BigDecimal.ZERO;
            String paymentMethod = "CASH";
            for (Payment p : payments) {
                if (p.getStatus() == PaymentStatus.PAID) {
                    totalPaid = totalPaid.add(p.getAmount() != null ? p.getAmount() : BigDecimal.ZERO);
                }
                if (p.getPaymentMethod() != null) {
                    paymentMethod = p.getPaymentMethod().name();
                }
            }

            BigDecimal totalPrice = booking.getTotalPrice() != null ? booking.getTotalPrice() : BigDecimal.ZERO;
            boolean hasCollectedNote = booking.getNotes() != null && booking.getNotes().contains("[ĐÃ THU ĐỦ TIỀN");
            boolean isFullyPaid = hasCollectedNote || totalPaid.compareTo(totalPrice) >= 0;

            BigDecimal remainingToCollect = isFullyPaid 
                ? BigDecimal.ZERO 
                : totalPrice.subtract(totalPaid).max(BigDecimal.ZERO);

            map.put("totalPaid", totalPaid);
            map.put("isFullyPaid", isFullyPaid);
            map.put("remainingToCollect", remainingToCollect);
            map.put("paymentMethod", paymentMethod);

            // Thông tin khách hàng
            map.put("customerName", booking.getUser().getFullName());
            map.put("customerPhone", booking.getUser().getPhone());

            // Địa chỉ nếu làm tại nhà
            Optional<BookingAddress> addrOpt = bookingAddressRepository.findByBookingId(booking.getId());
            if (addrOpt.isPresent()) {
                map.put("address", addrOpt.get().getAddress());
                map.put("distanceKm", addrOpt.get().getDistanceKm());
            } else {
                map.put("address", "Tại Studio DungDorys (120 Phố Huế, Q. Hai Bà Trưng)");
                map.put("distanceKm", 0);
            }

            // Trạng thái xin hủy ca của thợ
            map.put("cancelRequested", item.getCancelRequested() != null && item.getCancelRequested());
            map.put("cancelReason", item.getCancelReason());
            map.put("cancelStatus", item.getCancelStatus());
            map.put("cancelRequestedAt", item.getCancelRequestedAt());
            map.put("originalArtistId", item.getOriginalArtistId());

            // Kiểm tra ca có thể gửi yêu cầu hủy không (trước giờ bắt đầu ít nhất 2 tiếng và chưa hủy/hoàn thành)
            java.time.LocalDateTime shiftStart = java.time.LocalDateTime.of(booking.getBookingDate(), item.getStartTime());
            java.time.LocalDateTime now = java.time.LocalDateTime.now();
            boolean canCancel = now.isBefore(shiftStart.minusHours(2)) 
                    && booking.getStatus() != com.bookingmakeup.enums.BookingStatus.COMPLETED
                    && booking.getStatus() != com.bookingmakeup.enums.BookingStatus.CANCELLED
                    && !("PENDING".equals(item.getCancelStatus()));
            map.put("canCancel", canCancel);

            return map;
        }).toList();

        return ApiResponse.success("Lấy danh sách ca làm việc của thợ thành công", result);
    }

    /**
     * Thợ yêu cầu hủy ca làm việc (gửi lý do chờ Admin duyệt để đổi thợ khác)
     * Ràng buộc: Chỉ được yêu cầu trước giờ bắt đầu ít nhất 2 tiếng.
     */
    @PostMapping("/assignments/{itemId}/request-cancel")
    @Transactional
    public ApiResponse<Map<String, Object>> requestCancelAssignment(
            @PathVariable Long itemId,
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        MakeupArtist artist = getArtistFromPrincipal(currentUser);
        BookingItem item = bookingItemRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("BookingItem", "id", itemId));

        if (!item.getMakeupArtist().getId().equals(artist.getId())) {
            throw new BadRequestException("Bạn không được phân công phụ trách ca làm việc này!");
        }

        Booking booking = item.getBooking();
        if (booking == null) {
            throw new BadRequestException("Đơn đặt lịch không tồn tại!");
        }

        if (booking.getStatus() == com.bookingmakeup.enums.BookingStatus.COMPLETED) {
            throw new BadRequestException("Không thể yêu cầu hủy ca làm việc đã hoàn tất!");
        }
        if (booking.getStatus() == com.bookingmakeup.enums.BookingStatus.CANCELLED) {
            throw new BadRequestException("Đơn đặt lịch này đã bị hủy từ trước!");
        }

        if (Boolean.TRUE.equals(item.getCancelRequested()) && "PENDING".equals(item.getCancelStatus())) {
            throw new BadRequestException("Bạn đã gửi yêu cầu hủy ca này rồi. Vui lòng chờ Admin xem xét và điều phối thợ khác!");
        }

        // Kiểm tra ràng buộc thời gian: chỉ được gửi trước giờ bắt đầu làm ít nhất 2 tiếng
        java.time.LocalDateTime shiftStart = java.time.LocalDateTime.of(booking.getBookingDate(), item.getStartTime());
        java.time.LocalDateTime now = java.time.LocalDateTime.now();
        if (!now.isBefore(shiftStart.minusHours(2))) {
            throw new BadRequestException("Chỉ được gửi yêu cầu hủy ca trước giờ bắt đầu làm ít nhất 2 tiếng để Admin kịp điều phối thợ thay thế!");
        }

        String reason = body != null && body.containsKey("reason") ? body.get("reason").toString().trim() : "";
        if (reason.isBlank()) {
            throw new BadRequestException("Vui lòng ghi rõ lý do bạn cần xin hủy ca làm việc này!");
        }

        item.setCancelRequested(true);
        item.setCancelReason(reason);
        item.setCancelRequestedAt(java.time.LocalDateTime.now());
        item.setCancelStatus("PENDING");
        bookingItemRepository.save(item);

        // Lưu thông tin vào ghi chú đơn để Admin tiện theo dõi
        String artistName = artist.getUser() != null ? artist.getUser().getFullName() : ("Thợ #" + artist.getId());
        String cancelNote = String.format("[YÊU CẦU ĐỔI THỢ] Thợ %s xin hủy ca #%d (Dịch vụ: %s). Lý do: %s",
                artistName, item.getId(), item.getMakeupService().getServiceName(), reason);
        String currentNotes = booking.getNotes() != null ? booking.getNotes() : "";
        if (!currentNotes.contains("[YÊU CẦU ĐỔI THỢ]")) {
            booking.setNotes((cancelNote + "\n" + currentNotes).trim());
            bookingRepository.save(booking);
        }

        log.info("Artist {} (#{}) đã gửi yêu cầu hủy ca item #{}. Lý do: {}", artistName, artist.getId(), itemId, reason);

        Map<String, Object> res = new HashMap<>();
        res.put("itemId", itemId);
        res.put("bookingId", booking.getId());
        res.put("cancelStatus", "PENDING");
        res.put("cancelReason", reason);
        return ApiResponse.success("Đã gửi yêu cầu hủy ca đến Quản trị viên thành công. Vui lòng chờ Admin duyệt và điều phối thợ khác!", res);
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
        map.put("workingHours", artist.getWorkingHours());
        map.put("workingDays", artist.getWorkingDays());
        map.put("active", artist.getActive());

        return ApiResponse.success("Lấy hồ sơ cá nhân nghệ sĩ thành công", map);
    }

    /**
     * 5. Cập nhật hồ sơ cá nhân của thợ
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

