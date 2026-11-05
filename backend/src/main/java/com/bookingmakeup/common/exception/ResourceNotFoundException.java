package com.bookingmakeup.common.exception;

import org.springframework.http.HttpStatus;

public class ResourceNotFoundException extends AppException {

    public ResourceNotFoundException(String message) {
        super(HttpStatus.NOT_FOUND, message);
    }

    public ResourceNotFoundException(String resourceName, String fieldName, Object fieldValue) {
        super(HttpStatus.NOT_FOUND, String.format("Không tìm thấy %s với %s: '%s'",
                translateResourceName(resourceName),
                translateFieldName(fieldName),
                fieldValue));
    }

    private static String translateResourceName(String name) {
        if (name == null) return "dữ liệu";
        return switch (name) {
            case "User" -> "người dùng";
            case "Booking" -> "đơn đặt lịch";
            case "BookingItem" -> "ca dịch vụ";
            case "MakeupArtist" -> "chuyên viên trang điểm";
            case "MakeupService" -> "dịch vụ trang điểm";
            case "ServiceCategory" -> "danh mục dịch vụ";
            case "MakeupLayout" -> "phong cách trang điểm";
            case "Voucher" -> "mã khuyến mãi";
            case "Portfolio" -> "bộ sưu tập";
            case "ArtistSchedule" -> "lịch làm việc";
            case "Payment" -> "giao dịch thanh toán";
            case "Review" -> "đánh giá";
            default -> name;
        };
    }

    private static String translateFieldName(String field) {
        if (field == null) return "mã";
        return switch (field) {
            case "id" -> "ID";
            case "userId" -> "mã người dùng";
            case "email" -> "email";
            case "code" -> "mã";
            default -> field;
        };
    }
}
