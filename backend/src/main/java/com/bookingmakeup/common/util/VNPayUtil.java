package com.bookingmakeup.common.util;

import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.io.UnsupportedEncodingException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

@Slf4j
public class VNPayUtil {

    /**
     * Băm dữ liệu bằng giải thuật HMAC-SHA512 với khóa bí mật vnp_HashSecret
     */
    public static String hmacSHA512(final String key, final String data) {
        try {
            if (key == null || data == null) {
                return "";
            }
            final Mac hmac512 = Mac.getInstance("HmacSHA512");
            byte[] hmacKeyBytes = key.getBytes(StandardCharsets.UTF_8);
            final SecretKeySpec secretKey = new SecretKeySpec(hmacKeyBytes, "HmacSHA512");
            hmac512.init(secretKey);
            byte[] dataBytes = data.getBytes(StandardCharsets.UTF_8);
            byte[] result = hmac512.doFinal(dataBytes);
            StringBuilder sb = new StringBuilder(2 * result.length);
            for (byte b : result) {
                sb.append(String.format("%02x", b & 0xff));
            }
            return sb.toString();
        } catch (Exception ex) {
            log.error("Lỗi khi hash HMAC-SHA512 VNPay: {}", ex.getMessage());
            return "";
        }
    }

    /**
     * Sắp xếp các tham số theo thứ tự Alphabet và tạo chuỗi hash data (URL encoded)
     * sau đó băm bằng vnp_HashSecret để kiểm tra hoặc tạo checksum
     */
    public static String hashAllFields(Map<String, String> fields, String hashSecret) {
        List<String> fieldNames = fields.keySet().stream()
                .filter(k -> fields.get(k) != null && !fields.get(k).trim().isEmpty())
                .sorted()
                .toList();

        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < fieldNames.size(); i++) {
            String fieldName = fieldNames.get(i);
            String fieldValue = fields.get(fieldName);
            try {
                sb.append(fieldName).append("=")
                  .append(URLEncoder.encode(fieldValue, StandardCharsets.US_ASCII.toString()));
            } catch (UnsupportedEncodingException e) {
                sb.append(fieldName).append("=").append(fieldValue);
            }
            if (i < fieldNames.size() - 1) {
                sb.append("&");
            }
        }
        return hmacSHA512(hashSecret, sb.toString());
    }

    /**
     * Xây dựng query string từ danh sách các tham số đã sắp xếp
     */
    public static String buildQueryUrl(Map<String, String> fields) {
        List<String> fieldNames = fields.keySet().stream()
                .filter(k -> fields.get(k) != null && !fields.get(k).trim().isEmpty())
                .sorted()
                .toList();

        StringBuilder query = new StringBuilder();
        for (int i = 0; i < fieldNames.size(); i++) {
            String fieldName = fieldNames.get(i);
            String fieldValue = fields.get(fieldName);
            try {
                query.append(URLEncoder.encode(fieldName, StandardCharsets.US_ASCII.toString()))
                     .append("=")
                     .append(URLEncoder.encode(fieldValue, StandardCharsets.US_ASCII.toString()));
            } catch (UnsupportedEncodingException e) {
                query.append(fieldName).append("=").append(fieldValue);
            }
            if (i < fieldNames.size() - 1) {
                query.append("&");
            }
        }
        return query.toString();
    }

    /**
     * Lấy địa chỉ IP của Client thực hiện thanh toán
     */
    public static String getIpAddress(HttpServletRequest request) {
        if (request == null) {
            return "127.0.0.1";
        }
        String ipAddress = request.getHeader("X-FORWARDED-FOR");
        if (ipAddress == null || ipAddress.isEmpty() || "unknown".equalsIgnoreCase(ipAddress)) {
            ipAddress = request.getHeader("Proxy-Client-IP");
        }
        if (ipAddress == null || ipAddress.isEmpty() || "unknown".equalsIgnoreCase(ipAddress)) {
            ipAddress = request.getHeader("WL-Proxy-Client-IP");
        }
        if (ipAddress == null || ipAddress.isEmpty() || "unknown".equalsIgnoreCase(ipAddress)) {
            ipAddress = request.getRemoteAddr();
        }
        if (ipAddress == null || ipAddress.isEmpty() || "unknown".equalsIgnoreCase(ipAddress) || ipAddress.contains(":")) {
            ipAddress = "127.0.0.1";
        }
        if (ipAddress.contains(",")) {
            ipAddress = ipAddress.split(",")[0].trim();
        }
        if (ipAddress.contains(":")) {
            ipAddress = "127.0.0.1";
        }
        return ipAddress;
    }
}
