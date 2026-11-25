package com.example.backend_java.util;

import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.net.URI;

/**
 * Kiểm tra an toàn cho các URL người dùng nhập vào (chặn javascript:, data:, vbscript:, file:).
 */
public final class UrlValidationUtil {

    private UrlValidationUtil() {}

    public static void validateHttpUrlOrNull(String url, String fieldName) {
        if (url == null || url.isBlank()) {
            return;
        }
        String trimmed = url.trim();
        try {
            URI uri = URI.create(trimmed);
            String scheme = uri.getScheme();
            if (scheme == null || (!"https".equalsIgnoreCase(scheme) && !"http".equalsIgnoreCase(scheme))) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, fieldName + " phải là đường dẫn HTTP/HTTPS hợp lệ");
            }
            if (uri.getHost() == null || uri.getHost().isBlank()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, fieldName + " không có tên miền hợp lệ");
            }
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, fieldName + " không đúng định dạng URL");
        }
    }
}
