package com.bookingmakeup.service;

import com.bookingmakeup.entity.Booking;
import com.bookingmakeup.entity.BookingItem;
import com.bookingmakeup.entity.User;
import com.bookingmakeup.enums.LocationType;
import com.bookingmakeup.repository.BookingRepository;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.text.DecimalFormat;
import java.time.format.DateTimeFormatter;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;
    private final BookingRepository bookingRepository;

    @Value("${application.mail.from-email:makeupbooking.system@gmail.com}")
    private String fromEmail;

    @Value("${application.mail.sender-name:DungDorys Makeup Studio}")
    private String senderName;

    /**
     * Gửi Email xác nhận đặt lịch và thanh toán thành công hoàn toàn bất đồng bộ
     * (@Async).
     * Chạy trên thread pool riêng biệt (mailTaskExecutor), không làm nghẽn luồng xử
     * lý Webhook VNPay.
     * Khách hàng nhận được email ngay tức thì (dưới 5 giây).
     */
    @Async("mailTaskExecutor")
    @Transactional(readOnly = true)
    public void sendBookingConfirmationEmail(Long bookingId, String transactionNo, BigDecimal amountPaid) {
        log.info("[EmailService] Bắt đầu xử lý gửi email xác nhận bất đồng bộ cho đơn hàng #{}", bookingId);

        try {
            Optional<Booking> optBooking = bookingRepository.findById(bookingId);
            if (optBooking.isEmpty()) {
                log.warn("[EmailService] Không tìm thấy đơn hàng #{} để gửi email", bookingId);
                return;
            }

            Booking booking = optBooking.get();
            User customer = booking.getUser();
            if (customer == null || customer.getEmail() == null || customer.getEmail().trim().isEmpty()) {
                log.warn("[EmailService] Đơn hàng #{} không có email khách hàng hợp lệ", bookingId);
                return;
            }

            String customerEmail = customer.getEmail().trim();
            // Nếu khách hàng xác nhận email riêng ở bước 5, ưu tiên gửi về email đó
            String targetEmail = customerEmail;
            if (booking.getNotes() != null && booking.getNotes().contains("Email: ")) {
                try {
                    String part = booking.getNotes().substring(booking.getNotes().indexOf("Email: ") + 7);
                    if (part.contains("]")) part = part.substring(0, part.indexOf("]"));
                    part = part.trim();
                    if (part.contains("@")) {
                        targetEmail = part;
                    }
                } catch (Exception ignored) {}
            }

            String customerName = (customer.getFullName() != null && !customer.getFullName().trim().isEmpty())
                    ? customer.getFullName()
                    : "Quý khách";

            String htmlBody = buildBookingConfirmationHtml(booking, customerName, transactionNo, amountPaid);
            String subject = "[DungDorys Studio] Xác nhận đặt lịch #" + booking.getId()
                    + " - Thanh toán cọc thành công";

            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");

            helper.setFrom(fromEmail, senderName);
            helper.setReplyTo(fromEmail);
            // CHỈ GỬI DUY NHẤT TỚI EMAIL KHÁCH HÀNG (TUYỆT ĐỐI KHÔNG GỬI VỀ EMAIL STUDIO VTRUONG1628)
            helper.setTo(targetEmail);

            helper.setSubject(subject);
            helper.setText(htmlBody, true);

            mailSender.send(mimeMessage);
            log.info("[EmailService] ĐÃ GỬI THÀNH CÔNG email xác nhận đặt lịch #{} tới email khách hàng: {}", bookingId, targetEmail);

        } catch (Exception ex) {
            log.error("[EmailService] Gặp lỗi khi gửi email xác nhận đặt lịch #{}: {}", bookingId, ex.getMessage(), ex);
            // Không ném ngoại lệ ra ngoài để đảm bảo quy trình hệ thống không bị ảnh hưởng
        }
    }

    /**
     * Tạo template Email HTML sang trọng, hiện đại và chuẩn Responsive.
     * Sử dụng thay thế placeholder an toàn để tránh xung đột ký tự định dạng CSS
     * (như 100%, gradients...).
     */
    private String buildBookingConfirmationHtml(Booking booking, String customerName, String transactionNo,
            BigDecimal amountPaid) {
        DecimalFormat currencyFormatter = new DecimalFormat("#,###");

        String formattedDate = booking.getBookingDate() != null
                ? booking.getBookingDate().format(DateTimeFormatter.ofPattern("dd/MM/yyyy"))
                : "Chưa cập nhật";
        String formattedTime = booking.getBookingTime() != null
                ? booking.getBookingTime().format(DateTimeFormatter.ofPattern("HH:mm"))
                : "Chưa cập nhật";
        String targetEndTime = booking.getTargetEndTime() != null
                ? " (Dự kiến xong lúc " + booking.getTargetEndTime().format(DateTimeFormatter.ofPattern("HH:mm")) + ")"
                : "";

        String locationTypeText = (booking.getLocationType() == LocationType.STUDIO)
                ? "Tại Studio (DungDorys Makeup Studio - 204 Trần Duy Hưng, Cầu Giấy, Hà Nội)"
                : "Tại địa chỉ khách hàng (Tận nơi)";

        String detailedAddressRow = "";
        if (booking.getLocationType() == LocationType.HOME && booking.getBookingAddress() != null
                && booking.getBookingAddress().getAddress() != null) {
            detailedAddressRow = "<tr><td style=\"padding: 6px 0; color: #64748b;\">Địa chỉ đón tiếp:</td><td style=\"padding: 6px 0; color: #0f172a; font-weight: 600;\">"
                    + booking.getBookingAddress().getAddress() + "</td></tr>";
        }

        String notesRow = "";
        if (booking.getNotes() != null && !booking.getNotes().isBlank()) {
            notesRow = "<tr><td style=\"padding: 6px 0; color: #64748b;\">Ghi chú của bạn:</td><td style=\"padding: 6px 0; color: #0f172a;\">"
                    + booking.getNotes() + "</td></tr>";
        }

        BigDecimal totalPrice = booking.getTotalPrice() != null ? booking.getTotalPrice() : BigDecimal.ZERO;
        BigDecimal deposit = amountPaid != null ? amountPaid
                : (booking.getDepositAmount() != null ? booking.getDepositAmount() : BigDecimal.ZERO);
        BigDecimal remaining = totalPrice.subtract(deposit);
        if (remaining.compareTo(BigDecimal.ZERO) < 0) {
            remaining = BigDecimal.ZERO;
        }

        // Tạo danh sách dịch vụ chi tiết
        StringBuilder servicesHtml = new StringBuilder();
        if (booking.getItems() != null && !booking.getItems().isEmpty()) {
            for (BookingItem item : booking.getItems()) {
                String serviceName = item.getMakeupService() != null ? item.getMakeupService().getServiceName()
                        : "Dịch vụ trang điểm";
                String artistName = (item.getMakeupArtist() != null && item.getMakeupArtist().getUser() != null)
                        ? item.getMakeupArtist().getUser().getFullName()
                        : "Chuyên viên Master của Studio";
                String priceStr = item.getPrice() != null ? currencyFormatter.format(item.getPrice()) + " đ" : "-";

                servicesHtml.append("<tr>")
                        .append("<td style=\"padding: 10px 12px; border-bottom: 1px solid #f1f5f9; color: #1e293b; font-weight: 500;\">")
                        .append(serviceName)
                        .append("<br><span style=\"font-size: 12px; color: #64748b; font-weight: normal;\">Chuyên viên: ")
                        .append(artistName).append("</span>")
                        .append("</td>")
                        .append("<td style=\"padding: 10px 12px; border-bottom: 1px solid #f1f5f9; color: #0f172a; text-align: right; font-weight: 600;\">")
                        .append(priceStr)
                        .append("</td>")
                        .append("</tr>");
            }
        } else {
            String layoutName = booking.getLayout() != null ? booking.getLayout() : "Trang điểm theo yêu cầu";
            servicesHtml.append("<tr>")
                    .append("<td style=\"padding: 10px 12px; border-bottom: 1px solid #f1f5f9; color: #1e293b; font-weight: 500;\">")
                    .append(layoutName)
                    .append("</td>")
                    .append("<td style=\"padding: 10px 12px; border-bottom: 1px solid #f1f5f9; color: #0f172a; text-align: right; font-weight: 600;\">")
                    .append(currencyFormatter.format(totalPrice)).append(" đ")
                    .append("</td>")
                    .append("</tr>");
        }

        String template = """
                <!DOCTYPE html>
                <html lang="vi">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Xác nhận đặt lịch & Thanh toán cọc thành công</title>
                </head>
                <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #334155; line-height: 1.6;">
                    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 30px 15px;">
                        <tr>
                            <td align="center">
                                <table width="100%" max-width="620px" cellpadding="0" cellspacing="0" style="max-width: 620px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05); border: 1px solid #e2e8f0;">

                                    <!-- HEADER BANNER -->
                                    <tr>
                                        <td style="background: linear-gradient(135deg, #e11d48 0%, #f43f5e 50%, #fb7185 100%); padding: 35px 30px; text-align: center;">
                                            <div style="font-size: 26px; font-weight: 800; color: #ffffff; letter-spacing: 1px; text-transform: uppercase;">
                                                DUNGDORYS MAKEUP STUDIO
                                            </div>
                                            <div style="color: #ffe4e6; font-size: 14px; margin-top: 6px; font-weight: 500;">
                                                Vẻ Đẹp Hoàn Hảo & Tỏa Sáng Trong Mọi Khoảnh Khắc
                                            </div>
                                        </td>
                                    </tr>

                                    <!-- STATUS BADGE -->
                                    <tr>
                                        <td style="padding: 24px 30px 10px 30px; text-align: center;">
                                            <div style="display: inline-block; background-color: #dcfce7; color: #15803d; padding: 8px 18px; border-radius: 9999px; font-weight: 700; font-size: 13px; letter-spacing: 0.5px;">
                                                ✓ GIAO DỊCH THÀNH CÔNG • LỊCH HẸN ĐÃ XÁC NHẬN
                                            </div>
                                            <h2 style="color: #0f172a; margin: 18px 0 8px 0; font-size: 20px; font-weight: 700;">
                                                Cảm ơn bạn, {{CUSTOMER_NAME}}!
                                            </h2>
                                            <p style="margin: 0; color: #64748b; font-size: 14px; line-height: 1.6;">
                                                Chúng tôi đã nhận được khoản thanh toán đặt cọc qua cổng <strong>VNPay</strong>. Lịch hẹn của bạn đã được xác nhận chính thức trên hệ thống của DungDorys Makeup Studio.
                                            </p>
                                        </td>
                                    </tr>

                                    <!-- TRANSACTION SUMMARY BOX -->
                                    <tr>
                                        <td style="padding: 15px 30px;">
                                            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f1f5f9; border-radius: 12px; padding: 16px 20px;">
                                                <tr>
                                                    <td style="font-size: 13px; color: #64748b; padding: 4px 0;">Mã đơn đặt lịch:</td>
                                                    <td style="font-size: 14px; color: #0f172a; font-weight: 700; text-align: right; padding: 4px 0;">#{{BOOKING_ID}}</td>
                                                </tr>
                                                <tr>
                                                    <td style="font-size: 13px; color: #64748b; padding: 4px 0;">Mã giao dịch VNPay:</td>
                                                    <td style="font-size: 14px; color: #e11d48; font-weight: 700; text-align: right; padding: 4px 0;">{{TRANSACTION_NO}}</td>
                                                </tr>
                                                <tr>
                                                    <td style="font-size: 13px; color: #64748b; padding: 4px 0;">Phương thức:</td>
                                                    <td style="font-size: 14px; color: #0f172a; font-weight: 600; text-align: right; padding: 4px 0;">Thanh toán trực tuyến (VNPay QR / Thẻ)</td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>

                                    <!-- APPOINTMENT DETAILS -->
                                    <tr>
                                        <td style="padding: 10px 30px;">
                                            <h3 style="font-size: 15px; text-transform: uppercase; letter-spacing: 0.5px; color: #475569; margin: 0 0 12px 0; border-bottom: 2px solid #f1f5f9; padding-bottom: 8px;">
                                                📅 Thông Tin Lịch Hẹn
                                            </h3>
                                            <table width="100%" cellpadding="0" cellspacing="0" style="font-size: 14px;">
                                                <tr>
                                                    <td style="padding: 6px 0; color: #64748b; width: 38%;">Ngày thực hiện:</td>
                                                    <td style="padding: 6px 0; color: #0f172a; font-weight: 600;">{{BOOKING_DATE}}</td>
                                                </tr>
                                                <tr>
                                                    <td style="padding: 6px 0; color: #64748b;">Thời gian:</td>
                                                    <td style="padding: 6px 0; color: #0f172a; font-weight: 600;">{{BOOKING_TIME}}{{TARGET_END_TIME}}</td>
                                                </tr>
                                                <tr>
                                                    <td style="padding: 6px 0; color: #64748b;">Hình thức:</td>
                                                    <td style="padding: 6px 0; color: #0f172a; font-weight: 600;">{{LOCATION_TYPE}}</td>
                                                </tr>
                                                {{DETAILED_ADDRESS_ROW}}
                                                {{NOTES_ROW}}
                                            </table>
                                        </td>
                                    </tr>

                                    <!-- SERVICES TABLE -->
                                    <tr>
                                        <td style="padding: 15px 30px;">
                                            <h3 style="font-size: 15px; text-transform: uppercase; letter-spacing: 0.5px; color: #475569; margin: 0 0 12px 0; border-bottom: 2px solid #f1f5f9; padding-bottom: 8px;">
                                                💄 Chi Tiết Dịch Vụ Đặt Chỗ
                                            </h3>
                                            <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #f1f5f9; border-radius: 10px; overflow: hidden; font-size: 13px;">
                                                <thead>
                                                    <tr style="background-color: #f8fafc;">
                                                        <th style="padding: 10px 12px; text-align: left; color: #475569; font-weight: 600;">Dịch vụ</th>
                                                        <th style="padding: 10px 12px; text-align: right; color: #475569; font-weight: 600;">Chi phí</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {{SERVICES_HTML}}
                                                </tbody>
                                            </table>
                                        </td>
                                    </tr>

                                    <!-- FINANCIAL BREAKDOWN -->
                                    <tr>
                                        <td style="padding: 5px 30px 20px 30px;">
                                            <table width="100%" cellpadding="0" cellspacing="0" style="font-size: 14px; border-top: 1px dashed #cbd5e1; padding-top: 12px;">
                                                <tr>
                                                    <td style="padding: 5px 0; color: #64748b;">Tổng chi phí dịch vụ:</td>
                                                    <td style="padding: 5px 0; color: #0f172a; text-align: right; font-weight: 600;">{{TOTAL_PRICE}} đ</td>
                                                </tr>
                                                <tr>
                                                    <td style="padding: 5px 0; color: #16a34a; font-weight: 600;">Đã thanh toán cọc (VNPay):</td>
                                                    <td style="padding: 5px 0; color: #16a34a; text-align: right; font-weight: 700; font-size: 15px;">- {{DEPOSIT_PAID}} đ</td>
                                                </tr>
                                                <tr>
                                                    <td style="padding: 8px 0; color: #0f172a; font-weight: 700; font-size: 15px; border-top: 1px solid #e2e8f0;">Còn lại thanh toán tại buổi hẹn:</td>
                                                    <td style="padding: 8px 0; color: #e11d48; text-align: right; font-weight: 800; font-size: 17px; border-top: 1px solid #e2e8f0;">{{REMAINING_AMOUNT}} đ</td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>

                                    <!-- NOTICE BOX -->
                                    <tr>
                                        <td style="padding: 0 30px 25px 30px;">
                                            <div style="background-color: #fff1f2; border-left: 4px solid #f43f5e; padding: 14px 18px; border-radius: 8px;">
                                                <div style="color: #9f1239; font-weight: 700; font-size: 13px; margin-bottom: 4px;">
                                                    📌 Lưu ý quan trọng cho buổi hẹn:
                                                </div>
                                                <ul style="margin: 0; padding-left: 18px; color: #881337; font-size: 13px; line-height: 1.6;">
                                                    <li>Vui lòng giữ da mặt sạch sẽ, dưỡng ẩm nhẹ trước thời điểm chuyên viên bắt đầu trang điểm.</li>
                                                    <li>Xin vui lòng có mặt đúng giờ hẹn để chuyên viên có đủ thời gian hoàn thiện layout đẹp nhất.</li>
                                                    <li>Nếu cần điều chỉnh thời gian hẹn hoặc có yêu cầu đặc biệt, quý khách vui lòng liên hệ hotline trước 24 giờ.</li>
                                                </ul>
                                            </div>
                                        </td>
                                    </tr>

                                    <!-- FOOTER -->
                                    <tr>
                                        <td style="background-color: #0f172a; padding: 25px 30px; text-align: center; color: #94a3b8; font-size: 12px; line-height: 1.6;">
                                            <div style="font-weight: 700; color: #ffffff; font-size: 14px; margin-bottom: 6px;">
                                                DUNGDORYS MAKEUP STUDIO
                                            </div>
                                            <div>Hotline hỗ trợ: <strong>1900 6868</strong> | Email: vtruong1628@gmail.com</div>
                                            <div>Địa chỉ: 204 Trần Duy Hưng, Quận Cầu Giấy, Hà Nội</div>
                                            <div style="margin-top: 12px; color: #64748b; font-size: 11px;">
                                                Email này được gửi tự động từ hệ thống. Quý khách vui lòng không trả lời trực tiếp email này.
                                            </div>
                                        </td>
                                    </tr>

                                </table>
                            </td>
                        </tr>
                    </table>
                </body>
                </html>
                """;

        String finalTxn = (transactionNo != null && !transactionNo.isBlank()) ? transactionNo : "PAY" + booking.getId();

        return template
                .replace("{{CUSTOMER_NAME}}", customerName)
                .replace("{{BOOKING_ID}}", String.valueOf(booking.getId()))
                .replace("{{TRANSACTION_NO}}", finalTxn)
                .replace("{{BOOKING_DATE}}", formattedDate)
                .replace("{{BOOKING_TIME}}", formattedTime)
                .replace("{{TARGET_END_TIME}}", targetEndTime)
                .replace("{{LOCATION_TYPE}}", locationTypeText)
                .replace("{{DETAILED_ADDRESS_ROW}}", detailedAddressRow)
                .replace("{{NOTES_ROW}}", notesRow)
                .replace("{{SERVICES_HTML}}", servicesHtml.toString())
                .replace("{{TOTAL_PRICE}}", currencyFormatter.format(totalPrice))
                .replace("{{DEPOSIT_PAID}}", currencyFormatter.format(deposit))
                .replace("{{REMAINING_AMOUNT}}", currencyFormatter.format(remaining));
    }

    /**
     * Gửi email kiểm tra cấu hình SMTP
     */
    public void sendTestEmail(String toEmail) {
        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");
            helper.setFrom(fromEmail, senderName);
            helper.setTo(toEmail);
            helper.setSubject("🎉 [Kiểm tra] Hệ thống gửi email tự động DungDorys Makeup Studio");
            helper.setText(
                    """
                                <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 25px; color: #1e293b; background-color: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0; max-width: 550px; margin: 0 auto;">
                                    <div style="font-size: 20px; font-weight: bold; color: #e11d48; margin-bottom: 12px;">
                                        ✨ Kết nối Email SMTP Thành Công!
                                    </div>
                                    <p style="font-size: 14px; line-height: 1.6; color: #475569;">
                                        Xin chào, đây là email kiểm tra được gửi tự động từ hệ thống <strong>DungDorys Makeup Studio</strong>.
                                    </p>
                                    <p style="font-size: 14px; line-height: 1.6; color: #475569;">
                                        Tài khoản Gmail của bạn đã được kết nối thành công. Khi khách hàng hoàn tất thanh toán cọc qua cổng <strong>VNPay</strong>, hóa đơn điện tử và thông tin lịch hẹn sẽ được tự động gửi ngay lập tức tới email của khách hàng.
                                    </p>
                                    <div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8;">
                                        DungDorys Makeup Studio &copy; 2026
                                    </div>
                                </div>
                            """,
                    true);
            mailSender.send(mimeMessage);
            log.info("[EmailService] Đã gửi email test thành công tới: {}", toEmail);
        } catch (Exception e) {
            log.error("[EmailService] Lỗi khi gửi email test: {}", e.getMessage(), e);
            throw new RuntimeException("Gửi email thất bại: " + e.getMessage(), e);
        }
    }
}
