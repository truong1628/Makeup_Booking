package com.bookingmakeup.controller;

import com.bookingmakeup.common.exception.BadRequestException;
import com.bookingmakeup.common.exception.ResourceNotFoundException;
import com.bookingmakeup.common.response.ApiResponse;
import com.bookingmakeup.entity.Booking;
import com.bookingmakeup.entity.Payment;
import com.bookingmakeup.enums.BookingStatus;
import com.bookingmakeup.enums.LocationType;
import com.bookingmakeup.enums.PaymentMethod;
import com.bookingmakeup.enums.PaymentStatus;
import com.bookingmakeup.repository.BookingRepository;
import com.bookingmakeup.repository.PaymentRepository;
import com.bookingmakeup.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/v1/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final BookingRepository bookingRepository;
    private final PaymentRepository paymentRepository;

    /**
     * Tạo đường dẫn thanh toán VNPay cho tiền cọc (30%) hoặc toàn bộ đơn
     */
    @PostMapping("/create-vnpay-url")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<Map<String, Object>> createVNPayUrl(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @RequestBody Map<String, Object> body
    ) {
        Long bookingId = Long.valueOf(body.get("bookingId").toString());
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking", "id", bookingId));

        if (!booking.getUser().getId().equals(currentUser.getId())) {
            throw new BadRequestException("Bạn không sở hữu đơn đặt lịch này");
        }

        String transactionCode = "VNPAY" + System.currentTimeMillis();
        // Cổng VNPay Sandbox URL mô phỏng
        String paymentUrl = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?vnp_Amount="
                + booking.getDepositAmount().multiply(new java.math.BigDecimal(100)).longValue()
                + "&vnp_Command=pay&vnp_CreateDate=" + LocalDateTime.now()
                + "&vnp_CurrCode=VND&vnp_TxnRef=" + transactionCode
                + "&vnp_OrderInfo=" + ("Dat+coc+lich+hen+" + booking.getId());

        Map<String, Object> result = new HashMap<>();
        result.put("bookingId", booking.getId());
        result.put("transactionCode", transactionCode);
        result.put("amount", booking.getDepositAmount());
        result.put("paymentUrl", paymentUrl);
        result.put("status", booking.getStatus());

        return ApiResponse.success("Tạo URL thanh toán VNPay thành công", result);
    }

    /**
     * Xác nhận thanh toán tiền cọc thành công (Mô phỏng IPN / Return URL từ VNPay)
     */
    @PostMapping("/confirm-vnpay")
    @Transactional
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<Map<String, Object>> confirmVNPay(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @RequestBody Map<String, Object> body
    ) {
        Long bookingId = Long.valueOf(body.get("bookingId").toString());
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking", "id", bookingId));

        if (!booking.getUser().getId().equals(currentUser.getId())) {
            throw new BadRequestException("Bạn không sở hữu đơn đặt lịch này");
        }

        String transactionCode = body.containsKey("transactionCode") && body.get("transactionCode") != null
                ? body.get("transactionCode").toString()
                : "VNPAY" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        // 1. Tạo bản ghi thanh toán
        Payment payment = Payment.builder()
                .booking(booking)
                .paymentMethod(PaymentMethod.VNPAY)
                .transactionCode(transactionCode)
                .amount(booking.getDepositAmount())
                .status(PaymentStatus.PAID)
                .paymentDate(LocalDateTime.now())
                .build();
        paymentRepository.save(payment);

        // 2. Cập nhật trạng thái đơn hẹn sang CONFIRMED
        booking.setStatus(BookingStatus.CONFIRMED);
        bookingRepository.save(booking);

        log.info("Xác nhận thanh toán cọc VNPay thành công cho đơn #{} - Mã GD: {}", booking.getId(), transactionCode);

        Map<String, Object> res = new HashMap<>();
        res.put("bookingId", booking.getId());
        res.put("status", booking.getStatus());
        res.put("transactionCode", transactionCode);
        res.put("paidAmount", booking.getDepositAmount());

        return ApiResponse.success("Thanh toán tiền cọc qua cổng VNPay thành công! Lịch hẹn đã được xác nhận.", res);
    }

    /**
     * Xác nhận hình thức thanh toán trực tiếp tại Studio (CASH)
     * Dành riêng cho khách hàng đặt lịch dịch vụ tại Studio
     */
    @PostMapping("/pay-at-studio")
    @Transactional
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<Map<String, Object>> payAtStudio(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @RequestBody Map<String, Object> body
    ) {
        Long bookingId = Long.valueOf(body.get("bookingId").toString());
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking", "id", bookingId));

        if (!booking.getUser().getId().equals(currentUser.getId())) {
            throw new BadRequestException("Bạn không sở hữu đơn đặt lịch này");
        }

        if (booking.getLocationType() != LocationType.STUDIO) {
            throw new BadRequestException("Hình thức thanh toán tại studio chỉ áp dụng cho đơn thực hiện dịch vụ tại Studio");
        }

        String transactionCode = "STUDIO" + System.currentTimeMillis();

        // 1. Tạo bản ghi thanh toán CASH trạng thái PENDING
        Payment payment = Payment.builder()
                .booking(booking)
                .paymentMethod(PaymentMethod.CASH)
                .transactionCode(transactionCode)
                .amount(booking.getTotalPrice())
                .status(PaymentStatus.PENDING)
                .paymentDate(null)
                .build();
        paymentRepository.save(payment);

        // 2. Cập nhật trạng thái đơn hẹn sang CONFIRMED
        booking.setStatus(BookingStatus.CONFIRMED);
        bookingRepository.save(booking);

        log.info("Xác nhận hình thức thanh toán tại studio cho đơn #{}", booking.getId());

        Map<String, Object> res = new HashMap<>();
        res.put("bookingId", booking.getId());
        res.put("status", booking.getStatus());
        res.put("paymentMethod", PaymentMethod.CASH.name());
        res.put("transactionCode", transactionCode);
        res.put("totalPrice", booking.getTotalPrice());
        res.put("notice", "Studio có thể hủy lịch bất cứ lúc nào theo tình trạng chuyên viên");

        return ApiResponse.success("Đặt lịch thành công! Quý khách sẽ thanh toán tại studio khi đến làm dịch vụ. Lưu ý: Studio có thể hủy lịch bất cứ lúc nào theo tình trạng chuyên viên.", res);
    }
}
