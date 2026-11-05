package com.bookingmakeup.controller;

import com.bookingmakeup.common.response.ApiResponse;
import com.bookingmakeup.dto.request.BookingRequest;
import com.bookingmakeup.dto.request.CustomerBookingUpdateRequest;
import com.bookingmakeup.dto.request.DispatchEstimateRequest;
import com.bookingmakeup.dto.response.BookingResponse;
import com.bookingmakeup.dto.response.DispatchOptionResponse;
import com.bookingmakeup.entity.MakeupArtist;
import com.bookingmakeup.repository.MakeupArtistRepository;
import com.bookingmakeup.security.UserPrincipal;
import com.bookingmakeup.service.BookingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/bookings")
@RequiredArgsConstructor
public class BookingController {

    private final BookingService bookingService;
    private final MakeupArtistRepository makeupArtistRepository;

    /**
     * Public API: Ước tính các phương án điều phối thợ tự động (Tiết kiệm, Tiêu
     * chuẩn, Hỏa tốc)
     * Dựa trên số lượng khách, thời lượng dịch vụ và khung giờ mong muốn để đề xuất
     * phương án tối ưu.
     */
    @PostMapping("/dispatch-options")
    public ApiResponse<List<DispatchOptionResponse>> getDispatchOptions(
            @Valid @RequestBody DispatchEstimateRequest request) {
        List<DispatchOptionResponse> options = bookingService.estimateDispatchOptions(request);
        return ApiResponse.success("Ước tính các phương án điều phối thợ thành công", options);
    }

    /**
     * Authenticated API: Khách hàng tạo mới đơn đặt lịch hẹn (Booking)
     * Yêu cầu xác thực tài khoản. Hệ thống tự động gán thợ, tính tiền cọc 30% và
     * phụ phí di chuyển nếu có.
     */
    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<BookingResponse>> createBooking(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @Valid @RequestBody BookingRequest request) {
        BookingResponse response = bookingService.createBooking(currentUser, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created("Tạo đơn đặt lịch thành công", response));
    }

    /**
     * Admin API: Lấy toàn bộ danh sách đơn đặt lịch trong hệ thống
     * Dành riêng cho Quản trị viên để theo dõi, điều phối lịch hẹn và xuất báo cáo.
     */
    @GetMapping({ "/all", "/admin/all" })
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<List<BookingResponse>> getAllBookings() {
        List<BookingResponse> bookings = bookingService.getAllBookings();
        return ApiResponse.success("Lấy toàn bộ danh sách đơn đặt lịch thành công", bookings);
    }

    /**
     * Admin/Artist API: Cập nhật trạng thái tiến trình của đơn đặt lịch
     * Hỗ trợ chuyển đổi trạng thái: PENDING_PAYMENT, CONFIRMED, IN_PROGRESS,
     * COMPLETED, CANCELLED.
     */
    @PatchMapping("/{id:[0-9]+}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'ARTIST') or hasAnyAuthority('ROLE_ADMIN', 'ROLE_ARTIST')")
    public ApiResponse<BookingResponse> updateBookingStatus(
            @PathVariable Long id,
            @RequestParam com.bookingmakeup.enums.BookingStatus status) {
        BookingResponse response = bookingService.updateBookingStatus(id, status);
        return ApiResponse.success("Cập nhật trạng thái đơn đặt lịch thành công", response);
    }

    /**
     * Admin API: Xác nhận đã hoàn trả tiền cọc cho khách hàng
     * Dùng khi khách hàng hủy đơn hợp lệ (trước 24h) và Admin đã thực hiện chuyển
     * khoản hoàn cọc xong.
     */
    @PostMapping("/{id:[0-9]+}/confirm-refund")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<BookingResponse> confirmRefund(@PathVariable Long id) {
        BookingResponse response = bookingService.confirmRefund(id);
        return ApiResponse.success("Đã xác nhận hoàn tiền cọc cho khách hàng thành công", response);
    }

    /**
     * Admin API: Xác nhận đã thu đủ số tiền còn lại từ khách hàng
     * Áp dụng khi khách thanh toán nốt 70% sau dịch vụ hoặc đơn thanh toán 100%
     * trực tiếp tại Studio.
     */
    @PostMapping("/{id:[0-9]+}/collect-payment")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('ROLE_ADMIN')")
    public ApiResponse<BookingResponse> collectPayment(@PathVariable Long id) {
        BookingResponse response = bookingService.collectPayment(id);
        return ApiResponse.success("Đã xác nhận thu tiền thành công", response);
    }

    /**
     * Authenticated API: Khách hàng yêu cầu hủy đơn đặt lịch hẹn
     * Kiểm tra chính sách hủy: Nếu hủy trước 24h sẽ ghi nhận thông tin STK để hoàn
     * lại tiền cọc.
     */
    @PostMapping("/{id:[0-9]+}/cancel")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<BookingResponse> cancelBooking(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal currentUser,
            @RequestBody(required = false) Map<String, String> body) {
        String reason = body != null ? body.get("reason") : "Khách hàng yêu cầu hủy lịch";
        BookingResponse response = bookingService.cancelBooking(id, currentUser, reason);
        return ApiResponse.success("Hủy đơn đặt lịch thành công", response);
    }

    /**
     * Authenticated API: Khách hàng chỉnh sửa thông tin đơn đặt lịch (Đổi ngày/giờ
     * hẹn, phong cách makeup)
     * Ràng buộc nghiệp vụ: Chỉ cho phép chỉnh sửa trước thời điểm diễn ra lịch hẹn
     * tối thiểu 12 tiếng.
     */
    @PutMapping("/{id:[0-9]+}")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<BookingResponse> updateCustomerBooking(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal currentUser,
            @Valid @RequestBody CustomerBookingUpdateRequest request) {
        BookingResponse response = bookingService.updateCustomerBooking(id, currentUser, request);
        return ApiResponse.success("Cập nhật thông tin đơn đặt lịch thành công", response);
    }

    /**
     * Authenticated API: Lấy danh sách lịch sử tất cả các đơn đặt lịch của khách
     * hàng đang đăng nhập
     * Trả về danh sách đơn kèm theo thông tin chi tiết dịch vụ, thợ trang điểm và
     * trạng thái cọc.
     */
    @GetMapping("/my-bookings")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<List<BookingResponse>> getMyBookings(
            @AuthenticationPrincipal UserPrincipal currentUser) {
        List<BookingResponse> bookings = bookingService.getMyBookings(currentUser);
        return ApiResponse.success("Lấy danh sách lịch hẹn của bạn thành công", bookings);
    }

    /**
     * Authenticated API: Lấy thông tin chi tiết một đơn đặt lịch theo ID
     * Khách hàng chỉ xem được đơn của chính mình; Quản trị viên (Admin) có quyền
     * xem mọi đơn.
     */
    @GetMapping("/{id:[0-9]+}")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<BookingResponse> getBookingById(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        BookingResponse response = bookingService.getBookingById(id, currentUser);
        return ApiResponse.success("Lấy chi tiết đơn đặt lịch thành công", response);
    }

    /**
     * Public API: Kiểm tra độ khả dụng khung giờ của thợ trang điểm (Slot
     * Availability)
     * Xác định xem chuyên viên trang điểm cụ thể có bị trùng lịch hoặc nghỉ làm
     * trong khung giờ cần đặt hay không.
     */
    @GetMapping("/check-availability")
    public ApiResponse<Map<String, Object>> checkSlotAvailability(
            @RequestParam Long artistId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.TIME) LocalTime startTime,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.TIME) LocalTime endTime) {
        String reason = null;
        boolean available;
        try {
            bookingService.validateSlotAvailability(artistId, date, startTime, endTime);
            available = true;
        } catch (com.bookingmakeup.common.exception.BadRequestException e) {
            available = false;
            reason = e.getMessage();
        }

        Map<String, Object> result = new HashMap<>();
        result.put("artistId", artistId);
        result.put("date", date);
        result.put("startTime", startTime);
        result.put("endTime", endTime);
        result.put("available", available);
        result.put("reason", reason);
        return ApiResponse.success(available ? "Khung giờ trống, có thể đặt lịch" : "Khung giờ không khả dụng", result);
    }

    /**
     * Public API: Lấy danh sách thông tin các chuyên viên trang điểm đang hoạt động
     * Trả về thông tin hồ sơ: Tên, avatar, kinh nghiệm, khung giờ và ngày làm việc
     * của thợ.
     */
    @GetMapping("/artists")
    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public ApiResponse<List<Map<String, Object>>> getAvailableArtists() {
        List<MakeupArtist> artists = makeupArtistRepository.findAll().stream()
                .filter(a -> Boolean.TRUE.equals(a.getActive()))
                .toList();

        List<Map<String, Object>> response = artists.stream().map(a -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", a.getId());
            map.put("userId", a.getUser().getId());
            map.put("fullName", a.getUser().getFullName());
            map.put("avatar", a.getUser().getAvatar());
            map.put("email", a.getUser().getEmail());
            map.put("phone", a.getUser().getPhone());
            map.put("experience", a.getExperience());
            map.put("workingHours", a.getWorkingHours());
            map.put("workingDays", a.getWorkingDays());
            return map;
        }).toList();

        return ApiResponse.success("Lấy danh sách chuyên viên trang điểm thành công", response);
    }
}
