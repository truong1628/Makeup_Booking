package com.bookingmakeup.common.exception;

import org.springframework.http.HttpStatus;

public class PhoneAlreadyExistsException extends AppException {
    public PhoneAlreadyExistsException(String phone) {
        super(HttpStatus.CONFLICT, "Số điện thoại '" + phone + "' đã tồn tại trong hệ thống");
    }
}
