package com.bookingmakeup.controller;

import com.bookingmakeup.common.response.ApiResponse;
import com.bookingmakeup.dto.request.BookingRequest;
import com.bookingmakeup.dto.request.DispatchEstimateRequest;
import com.bookingmakeup.dto.response.BookingResponse;
import com.bookingmakeup.dto.response.DispatchOptionResponse;
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

import com.bookingmakeup.entity.MakeupArtist;
import com.bookingmakeup.repository.MakeupArtistRepository;

@RestController
@RequestMapping("/api/v1/bookings")
@RequiredArgsConstructor
public class BookingController {

    private final BookingService bookingService;
    private final MakeupArtistRepository makeupArtistRepository;

    @PostMapping("/dispatch-options")
    public ApiResponse<List<DispatchOptionResponse>> getDispatchOptions(
            @Valid @RequestBody DispatchEstimateRequest request
    ) {
        List<DispatchOptionResponse> options = bookingService.estimateDispatchOptions(request);
        return ApiResponse.success("Ước tính các phương án điều phối thợ thành công", options);
    }

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<BookingResponse>> createBooking(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @Valid @RequestBody BookingRequest request
    ) {
        BookingResponse response = bookingService.createBooking(currentUser, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created("Tạo đơn đặt lịch thành công", response));
    }

    @GetMapping({"/all", "/admin/all"})
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<List<BookingResponse>> getAllBookings() {
        List<BookingResponse> bookings = bookingService.getAllBookings();
        return ApiResponse.success("Lấy toàn bộ danh sách đơn đặt lịch thành công", bookings);
    }

    @PatchMapping("/{id:[0-9]+}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<BookingResponse> updateBookingStatus(
            @PathVariable Long id,
            @RequestParam com.bookingmakeup.enums.BookingStatus status
    ) {
        BookingResponse response = bookingService.updateBookingStatus(id, status);
        return ApiResponse.success("Cập nhật trạng thái đơn đặt lịch thành công", response);
    }

    @PostMapping("/{id:[0-9]+}/cancel")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<BookingResponse> cancelBooking(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal currentUser,
            @RequestBody(required = false) Map<String, String> body
    ) {
        String reason = body != null ? body.get("reason") : "Khách hàng yêu cầu hủy lịch";
        BookingResponse response = bookingService.cancelBooking(id, currentUser, reason);
        return ApiResponse.success("Hủy đơn đặt lịch thành công", response);
    }

    @GetMapping("/my-bookings")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<List<BookingResponse>> getMyBookings(
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        List<BookingResponse> bookings = bookingService.getMyBookings(currentUser);
        return ApiResponse.success("Lấy danh sách lịch hẹn của bạn thành công", bookings);
    }

    @GetMapping("/{id:[0-9]+}")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<BookingResponse> getBookingById(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        BookingResponse response = bookingService.getBookingById(id, currentUser);
        return ApiResponse.success("Lấy chi tiết đơn đặt lịch thành công", response);
    }

    @GetMapping("/check-availability")
    public ApiResponse<Map<String, Object>> checkSlotAvailability(
            @RequestParam Long artistId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.TIME) LocalTime startTime,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.TIME) LocalTime endTime
    ) {
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
            map.put("specialties", a.getSpecialties());
            map.put("workingHours", a.getWorkingHours());
            map.put("workingDays", a.getWorkingDays());
            return map;
        }).toList();

        return ApiResponse.success("Lấy danh sách chuyên viên trang điểm thành công", response);
    }
}
