package com.bookingmakeup.controller;

import com.bookingmakeup.common.response.ApiResponse;
import com.bookingmakeup.security.UserPrincipal;
import com.bookingmakeup.service.PaymentService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Controller xử lý thanh toán trực tuyến và ngoại tuyến cho đơn đặt lịch
 * Tích hợp cổng thanh toán VNPay (tạo URL, IPN Webhook, Return URL), thanh toán tiền mặt tại Studio và gửi email hóa đơn.
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;
    private final com.bookingmakeup.service.EmailService emailService;

    /**
     * Development API: Kiểm tra trực tiếp khả năng gửi email xác nhận tới hòm thư chỉ định
     */
    @GetMapping("/test-email")
    public ApiResponse<String> testEmail(@RequestParam String to) {
        emailService.sendTestEmail(to);
        return ApiResponse.success("Đã gửi email thử nghiệm thành công tới: " + to, "OK");
    }

    /**
     * Internal API: Kích hoạt gửi email xác nhận đặt lịch thành công cho một đơn hàng cụ thể
     */
    @GetMapping("/send-confirmation-email/{bookingId}")
    public ApiResponse<String> sendConfirmationEmail(@PathVariable Long bookingId) {
        emailService.sendBookingConfirmationEmail(bookingId, "VNPay-" + bookingId, null);
        return ApiResponse.success("Đã kích hoạt gửi email xác nhận cho đơn #" + bookingId, "OK");
    }

    /**
     * Authenticated API: Tạo URL chuyển hướng thanh toán tiền cọc qua cổng VNPay
     * Băm chuỗi dữ liệu giao dịch bằng thuật toán HMAC-SHA512 kèm vnp_HashSecret để đảm bảo an toàn.
     */
    @PostMapping("/create-vnpay-url")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<Map<String, Object>> createVNPayUrl(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @RequestBody Map<String, Object> body,
            HttpServletRequest request
    ) {
        Long bookingId = Long.valueOf(body.get("bookingId").toString());
        Map<String, Object> result = paymentService.createVNPayPaymentUrl(bookingId, currentUser, request);
        return ApiResponse.success("Tạo URL thanh toán VNPay thành công", result);
    }

    /**
     * Public Webhook API: Nhận thông báo kết quả giao dịch ngầm (IPN) từ máy chủ VNPay
     * Xác minh chữ ký Checksum chống giả mạo, cập nhật trạng thái đơn hàng sang CONFIRMED và kích hoạt gửi email.
     */
    @RequestMapping(value = "/vnpay-ipn", method = {RequestMethod.GET, RequestMethod.POST})
    public ResponseEntity<Map<String, String>> processVNPayIpn(@RequestParam Map<String, String> allParams) {
        Map<String, String> ipnResponse = paymentService.processVNPayIpn(allParams);
        return ResponseEntity.ok(ipnResponse);
    }

    /**
     * Public API: Nhận kết quả điều hướng về từ trình duyệt của khách hàng sau khi thanh toán trên VNPay
     * Kiểm tra chữ ký bảo mật và trả về kết quả thanh toán chi tiết cho giao diện người dùng.
     */
    @GetMapping("/vnpay-return")
    public ApiResponse<Map<String, Object>> processVNPayReturn(@RequestParam Map<String, String> allParams) {
        Map<String, Object> returnResult = paymentService.processVNPayReturn(allParams);
        return ApiResponse.success("Xác thực kết quả thanh toán VNPay thành công", returnResult);
    }

    /**
     * Authenticated API: Đăng ký hình thức thanh toán trực tiếp bằng tiền mặt tại Studio
     * Dành riêng cho các đơn đặt lịch thực hiện tại Studio không yêu cầu thanh toán cọc trực tuyến.
     */
    @PostMapping("/pay-at-studio")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<Map<String, Object>> payAtStudio(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @RequestBody Map<String, Object> body
    ) {
        Long bookingId = Long.valueOf(body.get("bookingId").toString());
        Map<String, Object> res = paymentService.payAtStudio(bookingId, currentUser);
        return ApiResponse.success("Đặt lịch thành công! Quý khách sẽ thanh toán tại studio khi đến làm dịch vụ.", res);
    }
}
