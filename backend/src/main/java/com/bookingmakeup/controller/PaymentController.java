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

@Slf4j
@RestController
@RequestMapping("/api/v1/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;
    private final com.bookingmakeup.service.EmailService emailService;

    /**
     * Endpoint kiểm tra gửi email trực tiếp tới hộp thư chỉ định
     */
    @GetMapping("/test-email")
    public ApiResponse<String> testEmail(@RequestParam String to) {
        emailService.sendTestEmail(to);
        return ApiResponse.success("Đã gửi email thử nghiệm thành công tới: " + to, "OK");
    }

    /**
     * Kích hoạt gửi email xác nhận đặt lịch cho đơn hàng cụ thể
     */
    @GetMapping("/send-confirmation-email/{bookingId}")
    public ApiResponse<String> sendConfirmationEmail(@PathVariable Long bookingId) {
        emailService.sendBookingConfirmationEmail(bookingId, "VNPay-" + bookingId, null);
        return ApiResponse.success("Đã kích hoạt gửi email xác nhận cho đơn #" + bookingId, "OK");
    }

    /**
     * 1. Tạo chuỗi tham số, băm bằng vnp_HashSecret, trả về URL của VNPay cho Frontend chuyển hướng khách
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
     * 2. Nhận request gọi ngầm từ máy chủ VNPay (IPN Webhook).
     * Bắt buộc phải Verify Checksum lại chuỗi hash để chống giả mạo.
     * Trả về đúng định dạng RspCode và Message theo chuẩn kỹ thuật của VNPay.
     */
    @RequestMapping(value = "/vnpay-ipn", method = {RequestMethod.GET, RequestMethod.POST})
    public ResponseEntity<Map<String, String>> processVNPayIpn(@RequestParam Map<String, String> allParams) {
        Map<String, String> ipnResponse = paymentService.processVNPayIpn(allParams);
        return ResponseEntity.ok(ipnResponse);
    }

    /**
     * 3. Nhận request chuyển hướng từ trình duyệt khách hàng sau khi thanh toán xong trên cổng VNPay (Return URL).
     * Bắt buộc phải Verify Checksum lại chuỗi hash để đảm bảo tính toàn vẹn dữ liệu.
     */
    @GetMapping("/vnpay-return")
    public ApiResponse<Map<String, Object>> processVNPayReturn(@RequestParam Map<String, String> allParams) {
        Map<String, Object> returnResult = paymentService.processVNPayReturn(allParams);
        return ApiResponse.success("Xác thực kết quả thanh toán VNPay thành công", returnResult);
    }

    /**
     * 4. Xác nhận hình thức thanh toán trực tiếp tại Studio (CASH)
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
