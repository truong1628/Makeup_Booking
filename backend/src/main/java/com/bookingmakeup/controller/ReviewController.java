package com.bookingmakeup.controller;

import com.bookingmakeup.common.exception.BadRequestException;
import com.bookingmakeup.common.exception.ResourceNotFoundException;
import com.bookingmakeup.common.response.ApiResponse;
import com.bookingmakeup.entity.Booking;
import com.bookingmakeup.entity.Review;
import com.bookingmakeup.entity.User;
import com.bookingmakeup.enums.BookingStatus;
import com.bookingmakeup.repository.BookingRepository;
import com.bookingmakeup.repository.ReviewRepository;
import com.bookingmakeup.repository.UserRepository;
import com.bookingmakeup.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.util.HtmlUtils;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Slf4j
@RestController
@RequestMapping("/api/v1/reviews")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewRepository reviewRepository;
    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;

    /**
     * Khách hàng gửi đánh giá cho đơn hẹn (đã hoàn thành hoặc đã xác nhận)
     */
    @PostMapping
    @Transactional
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<Map<String, Object>> submitReview(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @RequestBody Map<String, Object> body
    ) {
        Long bookingId = Long.valueOf(body.get("bookingId").toString());
        Integer rating = Integer.valueOf(body.get("rating").toString());
        String rawComment = body.containsKey("comment") && body.get("comment") != null ? body.get("comment").toString().trim() : "";
        // Tự động escape các ký tự đặc biệt HTML/Script để phòng chống XSS Injection
        String comment = HtmlUtils.htmlEscape(rawComment);

        if (rating < 1 || rating > 5) {
            throw new BadRequestException("Số sao đánh giá phải từ 1 đến 5 sao");
        }

        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking", "id", bookingId));

        if (!booking.getUser().getId().equals(currentUser.getId())) {
            throw new BadRequestException("Bạn chỉ có thể đánh giá cho đơn đặt lịch của chính mình");
        }

        boolean isCancelled = booking.getStatus() == BookingStatus.CANCELLED || (booking.getNotes() != null && (booking.getNotes().contains("[Lý do hủy") || booking.getNotes().contains("[HOÀN CỌC") || booking.getNotes().contains("[ĐÃ HOÀN CỌC") || booking.getNotes().contains("[Tự động hủy")));
        if (isCancelled) {
            throw new BadRequestException("Đơn đặt lịch đã bị hủy, không được phép gửi đánh giá.");
        }

        if (booking.getStatus() != BookingStatus.COMPLETED) {
            throw new BadRequestException("Chỉ những lịch hẹn đã hoàn thành dịch vụ (COMPLETED) mới được phép gửi đánh giá.");
        }

        Optional<Review> existingReview = reviewRepository.findByBookingId(bookingId);
        if (existingReview.isPresent()) {
            // Cập nhật review cũ
            Review r = existingReview.get();
            r.setRating(rating);
            r.setComment(comment);
            reviewRepository.save(r);

            Map<String, Object> res = new HashMap<>();
            res.put("id", r.getId());
            res.put("bookingId", bookingId);
            res.put("rating", r.getRating());
            res.put("comment", r.getComment());
            return ApiResponse.success("Cập nhật đánh giá thành công", res);
        }

        User customer = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", currentUser.getId()));

        User artistUser = null;
        if (booking.getItems() != null && !booking.getItems().isEmpty() && booking.getItems().get(0).getMakeupArtist() != null) {
            artistUser = booking.getItems().get(0).getMakeupArtist().getUser();
        } else {
            artistUser = customer; // fallback
        }

        Review review = Review.builder()
                .booking(booking)
                .customer(customer)
                .artist(artistUser)
                .rating(rating)
                .comment(comment)
                .build();

        Review saved = reviewRepository.save(review);
        log.info("Khách hàng {} đã đánh giá {} sao cho đơn #{}", customer.getFullName(), rating, booking.getId());

        Map<String, Object> res = new HashMap<>();
        res.put("id", saved.getId());
        res.put("bookingId", bookingId);
        res.put("rating", saved.getRating());
        res.put("comment", saved.getComment());
        return ApiResponse.success("Gửi đánh giá dịch vụ thành công! Cảm ơn phản hồi của bạn.", res);
    }

    /**
     * Lấy đánh giá của một đơn hẹn
     */
    @GetMapping("/booking/{bookingId}")
    @Transactional(readOnly = true)
    public ApiResponse<Map<String, Object>> getReviewByBooking(@PathVariable Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId).orElse(null);
        if (booking != null) {
            boolean isCancelled = booking.getStatus() == BookingStatus.CANCELLED || (booking.getNotes() != null && (booking.getNotes().contains("[Lý do hủy") || booking.getNotes().contains("[HOÀN CỌC") || booking.getNotes().contains("[ĐÃ HOÀN CỌC") || booking.getNotes().contains("[Tự động hủy")));
            if (isCancelled) {
                return ApiResponse.success("Đơn đã bị hủy không có đánh giá", null);
            }
        }

        Optional<Review> reviewOpt = reviewRepository.findByBookingId(bookingId);
        if (reviewOpt.isEmpty()) {
            return ApiResponse.success("Đơn chưa có đánh giá", null);
        }
        Review r = reviewOpt.get();
        Map<String, Object> res = new HashMap<>();
        res.put("id", r.getId());
        res.put("bookingId", bookingId);
        res.put("rating", r.getRating());
        res.put("comment", r.getComment());
        res.put("customerName", r.getCustomer().getFullName());
        res.put("createdAt", r.getCreatedAt());
        return ApiResponse.success("Lấy đánh giá thành công", res);
    }

    /**
     * Lấy danh sách tất cả đánh giá của khách hàng hiện tại
     */
    @GetMapping("/my-reviews")
    @Transactional(readOnly = true)
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<List<Map<String, Object>>> getMyReviews(@AuthenticationPrincipal UserPrincipal currentUser) {
        List<Review> reviews = reviewRepository.findByCustomerId(currentUser.getId());
        List<Map<String, Object>> list = reviews.stream().map(r -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", r.getId());
            map.put("bookingId", r.getBooking().getId());
            map.put("rating", r.getRating());
            map.put("comment", r.getComment());
            map.put("createdAt", r.getCreatedAt());
            return map;
        }).toList();

        return ApiResponse.success("Lấy danh sách đánh giá của bạn thành công", list);
    }

    /**
     * Lấy danh sách đánh giá công khai cho một dịch vụ
     */
    @GetMapping("/service/{serviceId}")
    @Transactional(readOnly = true)
    public ApiResponse<List<Map<String, Object>>> getReviewsByService(@PathVariable Long serviceId) {
        List<Review> reviews = reviewRepository.findAll().stream()
                .filter(r -> r.getBooking() != null && r.getBooking().getItems() != null &&
                        r.getBooking().getItems().stream().anyMatch(item -> 
                            item.getMakeupService() != null && item.getMakeupService().getId().equals(serviceId)
                        ))
                .toList();

        List<Map<String, Object>> list = reviews.stream().map(r -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", r.getId());
            map.put("rating", r.getRating());
            map.put("comment", r.getComment());
            map.put("customerName", r.getCustomer() != null ? r.getCustomer().getFullName() : "Khách hàng");
            map.put("createdAt", r.getCreatedAt());
            return map;
        }).toList();

        return ApiResponse.success("Lấy danh sách đánh giá thành công", list);
    }
}
