package com.example.backend_java.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    // Xử lý lỗi validation (tương đương lỗi 422 Pydantic của FastAPI)
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidationErrors(MethodArgumentNotValidException ex) {
        List<FieldError> fieldErrors = ex.getBindingResult().getFieldErrors();
        String message = !fieldErrors.isEmpty()
                ? fieldErrors.get(0).getDefaultMessage()
                : "Dữ liệu đầu vào không hợp lệ";

        return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY)
                .body(Map.of("detail", message != null ? message : "Dữ liệu đầu vào không hợp lệ"));
    }

    // Xử lý ResponseStatusException (400, 401, 403, 404...)
    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, String>> handleResponseStatusException(ResponseStatusException ex) {
        return ResponseEntity.status(ex.getStatusCode())
                .body(Map.of("detail", ex.getReason() != null ? ex.getReason() : "Yêu cầu không hợp lệ"));
    }

    // Xử lý lỗi không xác định (ghi log server-side, KHÔNG tiết lộ chi tiết lỗi nội bộ / SQL ra client)
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, String>> handleGenericException(Exception ex) {
        log.error("Unhandled server exception", ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("detail", "Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau."));
    }
}
