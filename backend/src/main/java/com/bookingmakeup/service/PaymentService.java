package com.bookingmakeup.service;

import com.bookingmakeup.common.exception.BadRequestException;
import com.bookingmakeup.common.exception.ResourceNotFoundException;
import com.bookingmakeup.common.util.VNPayUtil;
import com.bookingmakeup.config.VNPayConfig;
import com.bookingmakeup.entity.Booking;
import com.bookingmakeup.entity.Payment;
import com.bookingmakeup.enums.BookingStatus;
import com.bookingmakeup.enums.LocationType;
import com.bookingmakeup.enums.PaymentMethod;
import com.bookingmakeup.enums.PaymentStatus;
import com.bookingmakeup.repository.BookingRepository;
import com.bookingmakeup.repository.PaymentRepository;
import com.bookingmakeup.security.UserPrincipal;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentService {

    private final BookingRepository bookingRepository;
    private final PaymentRepository paymentRepository;
    private final VNPayConfig vnPayConfig;
    private final EmailService emailService;

    private static final DateTimeFormatter VNPAY_DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");
    private static final ZoneId VN_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    /**
     * 1. Tạo chuỗi tham số, băm bằng vnp_HashSecret và trả về URL của VNPay cho Frontend chuyển hướng khách
     */
    @Transactional
    public Map<String, Object> createVNPayPaymentUrl(Long bookingId, UserPrincipal currentUser, HttpServletRequest request) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking", "id", bookingId));

        if (!booking.getUser().getId().equals(currentUser.getId())) {
            throw new BadRequestException("Bạn không sở hữu đơn đặt lịch này");
        }

        if (booking.getStatus() == BookingStatus.CANCELLED) {
            throw new BadRequestException("Đơn đặt lịch đã bị hủy, không thể thanh toán");
        }

        if (booking.getStatus() == BookingStatus.COMPLETED) {
            throw new BadRequestException("Đơn đặt lịch đã hoàn thành, không thể thanh toán thêm");
        }

        BigDecimal depositAmount = booking.getDepositAmount();
        if (depositAmount == null || depositAmount.compareTo(BigDecimal.ZERO) <= 0) {
            depositAmount = booking.getTotalPrice();
        }
        long amountInCents = depositAmount.multiply(new BigDecimal(100)).longValue();

        // Mã giao dịch tham chiếu duy nhất: chỉ gồm chữ và số [A-Za-z0-9], không chứa ký tự đặc biệt
        String txnRef = "PAY" + booking.getId() + "T" + System.currentTimeMillis();

        // Lưu trước bản ghi thanh toán PENDING để đối soát khi máy chủ VNPay gọi ngầm IPN hoặc Return
        Payment pendingPayment = Payment.builder()
                .booking(booking)
                .paymentMethod(PaymentMethod.VNPAY)
                .transactionCode(txnRef)
                .amount(depositAmount)
                .status(PaymentStatus.PENDING)
                .paymentDate(null)
                .build();
        paymentRepository.save(pendingPayment);

        LocalDateTime now = LocalDateTime.now(VN_ZONE);
        String vnpCreateDate = now.format(VNPAY_DATE_FORMATTER);

        Map<String, String> vnpParams = new HashMap<>();
        vnpParams.put("vnp_Version", vnPayConfig.getVnpVersion());
        vnpParams.put("vnp_Command", vnPayConfig.getVnpCommand());
        vnpParams.put("vnp_TmnCode", vnPayConfig.getVnpTmnCode());
        vnpParams.put("vnp_Amount", String.valueOf(amountInCents));
        vnpParams.put("vnp_CurrCode", "VND");
        vnpParams.put("vnp_TxnRef", txnRef);
        // vnp_OrderInfo bắt buộc là chuỗi ASCII không dấu, không chứa ký tự đặc biệt như '#'
        vnpParams.put("vnp_OrderInfo", "Thanh toan tien coc lich hen " + booking.getId());
        vnpParams.put("vnp_OrderType", "other");
        vnpParams.put("vnp_Locale", "vn");
        vnpParams.put("vnp_ReturnUrl", vnPayConfig.getVnpReturnUrl());
        vnpParams.put("vnp_IpAddr", VNPayUtil.getIpAddress(request));
        vnpParams.put("vnp_CreateDate", vnpCreateDate);
        // Không truyền vnp_ExpireDate để tránh lỗi lệch giờ với máy chủ VNPay Sandbox

        // Băm bằng vnp_HashSecret
        String secureHash = VNPayUtil.hashAllFields(vnpParams, vnPayConfig.getVnpHashSecret());

        // Ghép nối URL thanh toán hoàn chỉnh
        String paymentUrl = vnPayConfig.getVnpPayUrl() + "?" + VNPayUtil.buildQueryUrl(vnpParams)
                + "&vnp_SecureHash=" + secureHash;

        log.info("[VNPay] Tạo URL thanh toán cho đơn #{} thành công. TxnRef: {}, TmnCode: {}",
                booking.getId(), txnRef, vnPayConfig.getVnpTmnCode());

        Map<String, Object> result = new HashMap<>();
        result.put("bookingId", booking.getId());
        result.put("transactionCode", txnRef);
        result.put("amount", depositAmount);
        result.put("paymentUrl", paymentUrl);
        result.put("status", booking.getStatus());

        return result;
    }

    /**
     * 2. Nhận request gọi ngầm từ máy chủ VNPay (IPN).
     * Bắt buộc phải Verify Checksum lại chuỗi hash để chống giả mạo.
     */
    @Transactional
    public Map<String, String> processVNPayIpn(Map<String, String> allParams) {
        log.info("[VNPay IPN] Nhận request gọi ngầm từ máy chủ VNPay: {}", allParams);

        String vnpSecureHash = allParams.get("vnp_SecureHash");
        if (vnpSecureHash == null || vnpSecureHash.trim().isEmpty()) {
            log.warn("[VNPay IPN] LỖI: Request thiếu vnp_SecureHash");
            return Map.of("RspCode", "97", "Message", "Invalid Checksum");
        }

        // 1. Thu thập tất cả các trường vnp_ (ngoại trừ hash và hashType) để verify checksum
        Map<String, String> fields = new HashMap<>();
        for (Map.Entry<String, String> entry : allParams.entrySet()) {
            String key = entry.getKey();
            String val = entry.getValue();
            if (key != null && key.startsWith("vnp_")
                    && !key.equals("vnp_SecureHash")
                    && !key.equals("vnp_SecureHashType")
                    && val != null && !val.trim().isEmpty()) {
                fields.put(key, val);
            }
        }

        // Băm lại bằng vnp_HashSecret
        String calculatedHash = VNPayUtil.hashAllFields(fields, vnPayConfig.getVnpHashSecret());

        // BẮT BUỘC: Verify Checksum lại chuỗi hash để chống giả mạo
        if (!calculatedHash.equalsIgnoreCase(vnpSecureHash)) {
            log.warn("[VNPay IPN] CẢNH BÁO GIẢ MẠO: Checksum không khớp! Calculated: {}, Received: {}", calculatedHash, vnpSecureHash);
            return Map.of("RspCode", "97", "Message", "Invalid Checksum");
        }

        // 2. Trích xuất mã đơn hàng từ vnp_TxnRef
        String txnRef = allParams.get("vnp_TxnRef");
        if (txnRef == null || txnRef.trim().isEmpty()) {
            log.warn("[VNPay IPN] Request thiếu vnp_TxnRef");
            return Map.of("RspCode", "01", "Message", "Order not found");
        }

        Booking booking = null;
        Optional<Payment> optPayment = paymentRepository.findByTransactionCode(txnRef);
        if (optPayment.isPresent()) {
            booking = optPayment.get().getBooking();
        } else {
            try {
                String raw = txnRef.startsWith("PAY") ? txnRef.substring(3) : txnRef;
                Long bookingId = Long.parseLong(raw.contains("T") ? raw.split("T")[0] : raw.split("_")[0]);
                booking = bookingRepository.findById(bookingId).orElse(null);
            } catch (Exception e) {
                log.warn("[VNPay IPN] Không phân giải được bookingId từ TxnRef: {}", txnRef);
            }
        }

        if (booking == null) {
            log.warn("[VNPay IPN] Không tìm thấy đơn hàng cho TxnRef: {}", txnRef);
            return Map.of("RspCode", "01", "Message", "Order not found");
        }

        // 3. Kiểm tra số tiền thanh toán
        try {
            long vnpAmount = Long.parseLong(allParams.get("vnp_Amount")) / 100;
            BigDecimal expectedDeposit = booking.getDepositAmount() != null ? booking.getDepositAmount() : booking.getTotalPrice();
            if (vnpAmount != expectedDeposit.longValue()) {
                log.warn("[VNPay IPN] Số tiền không khớp! VNPay: {}, Đơn hàng: {}", vnpAmount, expectedDeposit.longValue());
                return Map.of("RspCode", "04", "Message", "Invalid Amount");
            }
        } catch (Exception e) {
            log.error("[VNPay IPN] Lỗi parse số tiền: {}", e.getMessage());
            return Map.of("RspCode", "04", "Message", "Invalid Amount");
        }

        // 4. Kiểm tra trạng thái đơn hàng (Đã xác nhận trước đó chưa)
        if (booking.getStatus() == BookingStatus.CONFIRMED) {
            log.info("[VNPay IPN] Đơn hàng #{} đã được xác nhận trước đó.", booking.getId());
            return Map.of("RspCode", "02", "Message", "Order already confirmed");
        }

        // 5. Kiểm tra kết quả giao dịch từ VNPay
        String responseCode = allParams.get("vnp_ResponseCode");
        String transactionStatus = allParams.get("vnp_TransactionStatus");
        String transactionNo = allParams.get("vnp_TransactionNo");

        if ("00".equals(responseCode) && ("00".equals(transactionStatus) || transactionStatus == null)) {
            // Thanh toán thành công -> Cập nhật đơn sang CONFIRMED
            booking.setStatus(BookingStatus.CONFIRMED);
            bookingRepository.save(booking);

            Payment payment = optPayment.isPresent() ? optPayment.get() : Payment.builder()
                    .booking(booking)
                    .paymentMethod(PaymentMethod.VNPAY)
                    .amount(booking.getDepositAmount())
                    .build();
            payment.setTransactionCode(transactionNo != null ? transactionNo : txnRef);
            payment.setStatus(PaymentStatus.PAID);
            payment.setPaymentDate(LocalDateTime.now());
            paymentRepository.save(payment);

            log.info("[VNPay IPN] Xác nhận thanh toán thành công đơn #{}, mã GD VNPay: {}", booking.getId(), transactionNo);

            // Bất đồng bộ (@Async): Gửi email xác nhận đặt lịch ngay sau khi Webhook VNPay báo thành công, không làm nghẽn luồng chính
            try {
                emailService.sendBookingConfirmationEmail(booking.getId(), transactionNo, booking.getDepositAmount());
            } catch (Exception e) {
                log.error("[VNPay IPN] Lỗi kích hoạt gửi email cho đơn #{}: {}", booking.getId(), e.getMessage());
            }

            return Map.of("RspCode", "00", "Message", "Confirm Success");
        } else {
            // Giao dịch thất bại hoặc khách hủy
            if (optPayment.isPresent()) {
                Payment payment = optPayment.get();
                payment.setStatus(PaymentStatus.FAILED);
                paymentRepository.save(payment);
            }
            log.warn("[VNPay IPN] Thanh toán đơn #{} không thành công với responseCode: {}", booking.getId(), responseCode);
            return Map.of("RspCode", "00", "Message", "Confirm Success");
        }
    }

    /**
     * 3. Xử lý Return URL khi khách hàng được VNPay chuyển hướng quay lại website.
     * Bắt buộc verify checksum để đảm bảo tính toàn vẹn và cập nhật trạng thái đơn nếu IPN đến muộn.
     */
    @Transactional
    public Map<String, Object> processVNPayReturn(Map<String, String> allParams) {
        log.info("[VNPay Return] Nhận request chuyển hướng khách hàng: {}", allParams);

        String vnpSecureHash = allParams.get("vnp_SecureHash");
        if (vnpSecureHash == null || vnpSecureHash.trim().isEmpty()) {
            throw new BadRequestException("Thiếu chữ ký kiểm tra bảo mật từ VNPay");
        }

        // Lọc tham số để băm lại
        Map<String, String> fields = new HashMap<>();
        for (Map.Entry<String, String> entry : allParams.entrySet()) {
            String key = entry.getKey();
            String val = entry.getValue();
            if (key != null && key.startsWith("vnp_")
                    && !key.equals("vnp_SecureHash")
                    && !key.equals("vnp_SecureHashType")
                    && val != null && !val.trim().isEmpty()) {
                fields.put(key, val);
            }
        }

        String calculatedHash = VNPayUtil.hashAllFields(fields, vnPayConfig.getVnpHashSecret());

        // Bắt buộc verify checksum chống giả mạo
        if (!calculatedHash.equalsIgnoreCase(vnpSecureHash)) {
            log.error("[VNPay Return] Checksum không hợp lệ! Computed: {}, Received: {}", calculatedHash, vnpSecureHash);
            throw new BadRequestException("Chữ ký bảo mật VNPay không hợp lệ (Checksum verification failed)!");
        }

        String txnRef = allParams.get("vnp_TxnRef");
        Booking booking = null;
        Optional<Payment> optPayment = paymentRepository.findByTransactionCode(txnRef);
        if (optPayment.isPresent()) {
            booking = optPayment.get().getBooking();
        } else {
            try {
                String raw = txnRef.startsWith("PAY") ? txnRef.substring(3) : txnRef;
                Long bookingId = Long.parseLong(raw.contains("T") ? raw.split("T")[0] : raw.split("_")[0]);
                booking = bookingRepository.findById(bookingId).orElse(null);
            } catch (Exception ignored) {}
        }

        if (booking == null) {
            throw new ResourceNotFoundException("Booking", "txnRef", txnRef);
        }

        String responseCode = allParams.get("vnp_ResponseCode");
        String transactionNo = allParams.get("vnp_TransactionNo");
        String bankCode = allParams.get("vnp_BankCode");
        long amount = 0;
        try {
            amount = Long.parseLong(allParams.get("vnp_Amount")) / 100;
        } catch (Exception ignored) {}

        boolean isSuccess = "00".equals(responseCode);

        if (isSuccess && booking.getStatus() != BookingStatus.CONFIRMED) {
            booking.setStatus(BookingStatus.CONFIRMED);
            bookingRepository.save(booking);

            Payment payment = optPayment.isPresent() ? optPayment.get() : Payment.builder()
                    .booking(booking)
                    .paymentMethod(PaymentMethod.VNPAY)
                    .amount(booking.getDepositAmount())
                    .build();
            payment.setTransactionCode(transactionNo != null ? transactionNo : txnRef);
            payment.setStatus(PaymentStatus.PAID);
            payment.setPaymentDate(LocalDateTime.now());
            paymentRepository.save(payment);
            log.info("[VNPay Return] Cập nhật thành công đơn #{} qua Return URL", booking.getId());

            // Bất đồng bộ (@Async): Gửi email xác nhận đặt lịch nếu IPN chưa xử lý trước đó
            try {
                emailService.sendBookingConfirmationEmail(booking.getId(), transactionNo, booking.getDepositAmount());
            } catch (Exception e) {
                log.error("[VNPay Return] Lỗi kích hoạt gửi email cho đơn #{}: {}", booking.getId(), e.getMessage());
            }
        }

        Map<String, Object> response = new HashMap<>();
        response.put("success", isSuccess);
        response.put("bookingId", booking.getId());
        response.put("transactionCode", transactionNo != null ? transactionNo : txnRef);
        response.put("bankCode", bankCode);
        response.put("amount", amount);
        response.put("responseCode", responseCode);
        response.put("message", isSuccess ? "Thanh toán cọc VNPay thành công!" : "Giao dịch thanh toán không thành công hoặc khách hàng đã hủy.");

        return response;
    }

    /**
     * 4. Xác nhận hình thức thanh toán trực tiếp tại Studio (CASH)
     */
    @Transactional
    public Map<String, Object> payAtStudio(Long bookingId, UserPrincipal currentUser) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking", "id", bookingId));

        if (!booking.getUser().getId().equals(currentUser.getId())) {
            throw new BadRequestException("Bạn không sở hữu đơn đặt lịch này");
        }

        if (booking.getLocationType() != LocationType.STUDIO) {
            throw new BadRequestException("Hình thức thanh toán tại studio chỉ áp dụng cho đơn thực hiện dịch vụ tại Studio");
        }

        String transactionCode = "STUDIO" + System.currentTimeMillis();

        Payment payment = Payment.builder()
                .booking(booking)
                .paymentMethod(PaymentMethod.CASH)
                .transactionCode(transactionCode)
                .amount(booking.getTotalPrice())
                .status(PaymentStatus.PENDING)
                .paymentDate(null)
                .build();
        paymentRepository.save(payment);

        booking.setStatus(BookingStatus.CONFIRMED);
        bookingRepository.save(booking);

        log.info("Xác nhận hình thức thanh toán tại studio cho đơn #{}", booking.getId());

        try {
            emailService.sendBookingConfirmationEmail(booking.getId(), transactionCode, BigDecimal.ZERO);
        } catch (Exception e) {
            log.error("[PaymentService] Lỗi kích hoạt gửi email thanh toán tại studio cho đơn #{}: {}", booking.getId(), e.getMessage());
        }

        Map<String, Object> res = new HashMap<>();
        res.put("bookingId", booking.getId());
        res.put("status", booking.getStatus());
        res.put("paymentMethod", PaymentMethod.CASH.name());
        res.put("transactionCode", transactionCode);
        res.put("totalPrice", booking.getTotalPrice());
        res.put("notice", "Studio có thể hủy lịch bất cứ lúc nào theo tình trạng chuyên viên");

        return res;
    }
}
