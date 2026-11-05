package com.bookingmakeup.common.exception;

import com.bookingmakeup.common.response.ApiResponse;
import jakarta.validation.ConstraintViolationException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.TypeMismatchException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.LockedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.validation.FieldError;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiResponse<Object>> handleResourceNotFound(ResourceNotFoundException ex) {
        log.warn("Resource not found: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.error(HttpStatus.NOT_FOUND.value(), ex.getMessage()));
    }

    @ExceptionHandler(EmailAlreadyExistsException.class)
    public ResponseEntity<ApiResponse<Object>> handleEmailAlreadyExists(EmailAlreadyExistsException ex) {
        log.warn("Email conflict: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(ApiResponse.error(HttpStatus.CONFLICT.value(), ex.getMessage()));
    }

    @ExceptionHandler(PhoneAlreadyExistsException.class)
    public ResponseEntity<ApiResponse<Object>> handlePhoneAlreadyExists(PhoneAlreadyExistsException ex) {
        log.warn("Phone conflict: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(ApiResponse.error(HttpStatus.CONFLICT.value(), ex.getMessage()));
    }

    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<ApiResponse<Object>> handleNoResourceFound(NoResourceFoundException ex) {
        log.warn("Endpoint not found: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.error(HttpStatus.NOT_FOUND.value(), "Tài nguyên hoặc đường dẫn API không tồn tại: " + ex.getResourcePath()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Map<String, String>>> handleValidationExceptions(MethodArgumentNotValidException ex) {
        Map<String, String> errors = new LinkedHashMap<>();
        List<String> errorMessages = new ArrayList<>();

        for (FieldError error : ex.getBindingResult().getFieldErrors()) {
            String field = error.getField();
            String translatedMsg = translateValidationMessage(field, error.getDefaultMessage());
            errors.put(field, translatedMsg);
            if (!errorMessages.contains(translatedMsg)) {
                errorMessages.add(translatedMsg);
            }
        }

        String summaryMessage = errorMessages.isEmpty()
                ? "Dữ liệu yêu cầu không hợp lệ, vui lòng kiểm tra lại các trường thông tin"
                : String.join("; ", errorMessages);

        log.warn("Validation failed: {}", errors);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error(HttpStatus.BAD_REQUEST.value(), summaryMessage, errors));
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ApiResponse<Object>> handleHttpMessageNotReadable(HttpMessageNotReadableException ex) {
        log.warn("Malformed JSON request: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error(HttpStatus.BAD_REQUEST.value(), "Dữ liệu gửi lên không đúng định dạng hoặc chứa giá trị không hợp lệ"));
    }

    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ResponseEntity<ApiResponse<Object>> handleMissingServletRequestParameter(MissingServletRequestParameterException ex) {
        String message = String.format("Thiếu tham số bắt buộc '%s' trong yêu cầu", translateFieldLabel(ex.getParameterName()));
        log.warn("Missing request parameter: {}", message);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error(HttpStatus.BAD_REQUEST.value(), message));
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ApiResponse<Map<String, String>>> handleConstraintViolation(ConstraintViolationException ex) {
        Map<String, String> errors = new LinkedHashMap<>();
        List<String> errorMessages = new ArrayList<>();

        ex.getConstraintViolations().forEach(violation -> {
            String propertyPath = violation.getPropertyPath().toString();
            String translatedMsg = translateValidationMessage(propertyPath, violation.getMessage());
            errors.put(propertyPath, translatedMsg);
            if (!errorMessages.contains(translatedMsg)) {
                errorMessages.add(translatedMsg);
            }
        });

        String summaryMessage = errorMessages.isEmpty()
                ? "Tham số yêu cầu không hợp lệ"
                : String.join("; ", errorMessages);

        log.warn("Constraint violation: {}", errors);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error(HttpStatus.BAD_REQUEST.value(), summaryMessage, errors));
    }

    @ExceptionHandler({TypeMismatchException.class, MethodArgumentTypeMismatchException.class})
    public ResponseEntity<ApiResponse<Object>> handleTypeMismatch(TypeMismatchException ex) {
        String paramName = ex.getPropertyName();
        if (ex instanceof MethodArgumentTypeMismatchException methodEx) {
            paramName = methodEx.getName();
        }
        String message = String.format("Tham số '%s' có giá trị '%s' không đúng định dạng hợp lệ",
                translateFieldLabel(paramName),
                ex.getValue());
        log.warn("Type mismatch error: {}", message);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error(HttpStatus.BAD_REQUEST.value(), message));
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ApiResponse<Object>> handleDataIntegrityViolation(DataIntegrityViolationException ex) {
        log.warn("Data integrity violation: {}", ex.getMessage());
        String rawMsg = ex.getMostSpecificCause() != null ? ex.getMostSpecificCause().getMessage() : ex.getMessage();
        String friendlyMsg = "Dữ liệu vi phạm ràng buộc toàn vẹn trong cơ sở dữ liệu.";

        if (rawMsg != null) {
            String lower = rawMsg.toLowerCase();
            if (lower.contains("duplicate entry")) {
                friendlyMsg = "Dữ liệu đã tồn tại trong hệ thống (trùng mã, email hoặc thông tin duy nhất).";
            } else if (lower.contains("foreign key constraint fails") || lower.contains("cannot delete or update a parent row")) {
                friendlyMsg = "Không thể xóa hoặc sửa bản ghi này vì dữ liệu đang được liên kết sử dụng ở mục khác.";
            } else if (lower.contains("check constraint")) {
                friendlyMsg = "Giá trị nhập vào không thỏa mãn điều kiện kiểm tra dữ liệu của hệ thống.";
            } else if (lower.contains("cannot be null")) {
                friendlyMsg = "Thiếu thông tin bắt buộc, không được để trống dữ liệu.";
            }
        }

        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error(HttpStatus.BAD_REQUEST.value(), friendlyMsg));
    }

    @ExceptionHandler(AppException.class)
    public ResponseEntity<ApiResponse<Object>> handleAppException(AppException ex) {
        log.warn("AppException [{}]: {}", ex.getStatus(), ex.getMessage());
        return ResponseEntity.status(ex.getStatus())
                .body(ApiResponse.error(ex.getStatus().value(), ex.getMessage()));
    }

    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<ApiResponse<Object>> handleMethodNotSupported(HttpRequestMethodNotSupportedException ex) {
        log.warn("Method not supported: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.METHOD_NOT_ALLOWED)
                .body(ApiResponse.error(HttpStatus.METHOD_NOT_ALLOWED.value(), "Phương thức truy cập HTTP không được hỗ trợ: " + ex.getMethod()));
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ApiResponse<Object>> handleBadCredentials(BadCredentialsException ex) {
        log.warn("Bad credentials: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(ApiResponse.error(HttpStatus.UNAUTHORIZED.value(), "Email hoặc mật khẩu không chính xác"));
    }

    @ExceptionHandler({DisabledException.class, LockedException.class})
    public ResponseEntity<ApiResponse<Object>> handleAccountDisabledOrLocked(AuthenticationException ex) {
        log.warn("Account disabled or locked: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(ApiResponse.error(HttpStatus.FORBIDDEN.value(), "Tài khoản của bạn hiện đang bị khóa hoặc tạm ngừng hoạt động"));
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiResponse<Object>> handleAccessDenied(AccessDeniedException ex) {
        log.warn("Access denied: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(ApiResponse.error(HttpStatus.FORBIDDEN.value(), "Bạn không có quyền thực hiện thao tác này"));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Object>> handleAllUncaughtException(Exception ex) {
        log.error("Internal server error: ", ex);
        String msg = translateGenericExceptionMessage(ex.getMessage());
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error(HttpStatus.INTERNAL_SERVER_ERROR.value(), msg));
    }

    /**
     * Dịch tự động mọi thông báo mặc định bằng tiếng Anh của Spring / Hibernate Validator sang Tiếng Việt
     */
    private String translateValidationMessage(String field, String rawMessage) {
        String label = translateFieldLabel(field);
        if (rawMessage == null || rawMessage.isBlank()) {
            return label + " không hợp lệ";
        }

        String lower = rawMessage.toLowerCase().trim();
        if (lower.equals("must not be blank") || lower.equals("must not be empty") || lower.equals("may not be empty")) {
            return label + " không được để trống";
        }
        if (lower.equals("must not be null") || lower.equals("may not be null")) {
            return label + " là thông tin bắt buộc";
        }
        if (lower.startsWith("must be greater than or equal to")) {
            String val = rawMessage.replaceAll("(?i)must be greater than or equal to\\s*", "");
            return label + " phải lớn hơn hoặc bằng " + val;
        }
        if (lower.startsWith("must be greater than")) {
            String val = rawMessage.replaceAll("(?i)must be greater than\\s*", "");
            return label + " phải lớn hơn " + val;
        }
        if (lower.startsWith("must be less than or equal to")) {
            String val = rawMessage.replaceAll("(?i)must be less than or equal to\\s*", "");
            return label + " phải nhỏ hơn hoặc bằng " + val;
        }
        if (lower.startsWith("must be less than")) {
            String val = rawMessage.replaceAll("(?i)must be less than\\s*", "");
            return label + " phải nhỏ hơn " + val;
        }
        if (lower.contains("well-formed email address") || lower.contains("not a valid email")) {
            return "Địa chỉ email không đúng định dạng";
        }
        if (lower.startsWith("size must be between") || lower.startsWith("length must be between")) {
            String nums = rawMessage.replaceAll("(?i)(size|length) must be between\\s*", "").replace("and", "đến");
            return label + " phải có độ dài từ " + nums + " ký tự";
        }
        if (lower.startsWith("must match")) {
            return label + " không đúng định dạng quy định";
        }

        return rawMessage;
    }

    private String translateFieldLabel(String field) {
        if (field == null || field.isBlank()) return "Trường thông tin";
        return switch (field) {
            case "email" -> "Email";
            case "password" -> "Mật khẩu";
            case "currentPassword" -> "Mật khẩu hiện tại";
            case "newPassword" -> "Mật khẩu mới";
            case "confirmPassword" -> "Mật khẩu xác nhận";
            case "fullName", "name" -> "Họ và tên";
            case "phone", "contactPhone" -> "Số điện thoại";
            case "serviceName" -> "Tên dịch vụ";
            case "price" -> "Giá dịch vụ";
            case "duration" -> "Thời lượng thực hiện";
            case "bookingDate" -> "Ngày đặt lịch";
            case "bookingTime" -> "Giờ đặt lịch";
            case "items" -> "Danh sách dịch vụ";
            case "code", "voucherCode" -> "Mã khuyến mãi";
            case "discountValue" -> "Giá trị giảm giá";
            case "orderAmount" -> "Giá trị đơn hàng";
            case "title" -> "Tiêu đề";
            case "imageUrl", "image" -> "Hình ảnh";
            case "address" -> "Địa chỉ";
            case "rating" -> "Số sao đánh giá";
            default -> "Trường '" + field + "'";
        };
    }

    private String translateGenericExceptionMessage(String raw) {
        if (raw == null || raw.isBlank()) {
            return "Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau!";
        }
        String lower = raw.toLowerCase();
        if (lower.contains("bad credentials")) {
            return "Email hoặc mật khẩu không chính xác";
        }
        if (lower.contains("access is denied") || lower.contains("access denied")) {
            return "Bạn không có quyền thực hiện thao tác này";
        }
        if (lower.contains("maximum upload size exceeded")) {
            return "Kích thước tệp tải lên vượt quá giới hạn cho phép";
        }
        // Nếu thông báo đã có tiếng Việt thì giữ nguyên, ngược lại trả về thông báo tiếng Việt thân thiện
        if (raw.matches(".*[àáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđÀÁẢÃẠĂẮẰẲẴẶÂẤẦẨẪẬÈÉẺẼẸÊẾỀỂỄỆÌÍỈĨỊÒÓỎÕỌÔỐỒỔỖỘƠỚỜỞỠỢÙÚỦŨỤƯỨỪỬỮỰỲÝỶỸỴĐ].*")) {
            return raw;
        }
        return "Đã xảy ra lỗi xử lý trên hệ thống, vui lòng kiểm tra lại dữ liệu và thử lại.";
    }
}
