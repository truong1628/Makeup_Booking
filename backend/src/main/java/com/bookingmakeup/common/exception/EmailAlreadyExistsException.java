package com.bookingmakeup.common.exception;

import org.springframework.http.HttpStatus;

public class EmailAlreadyExistsException extends AppException {
    public EmailAlreadyExistsException(String email) {
        super(HttpStatus.CONFLICT, "Email '" + email + "' đã tồn tại trong hệ thống");
    }
}
