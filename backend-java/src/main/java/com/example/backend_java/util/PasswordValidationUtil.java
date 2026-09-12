package com.example.backend_java.util;

import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.regex.Pattern;

public class PasswordValidationUtil {

    private static final Pattern UPPERCASE_PATTERN = Pattern.compile(".*[A-Z].*");
    private static final Pattern SPECIAL_CHAR_PATTERN = Pattern.compile(".*[!@#$%^&*()_+\\-=\\[\\]{};':\"\\\\|,.<>\\/?`~].*");

    /**
     * Kiểm tra độ mạnh của mật khẩu:
     * - Tối thiểu 8 ký tự
     * - Chứa ít nhất 1 chữ cái in hoa (A-Z)
     * - Chứa ít nhất 1 ký tự đặc biệt (!@#$%^&*...)
     */
    public static void validate(String password) {
        if (password == null || password.trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Mật khẩu không được để trống!");
        }

        if (password.length() < 8) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Mật khẩu phải có tối thiểu 8 ký tự!");
        }

        if (!UPPERCASE_PATTERN.matcher(password).matches()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Mật khẩu phải chứa ít nhất 1 chữ cái in hoa (A-Z)!");
        }

        if (!SPECIAL_CHAR_PATTERN.matcher(password).matches()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Mật khẩu phải chứa ít nhất 1 ký tự đặc biệt (!@#$%^&*...)!");
        }
    }
}
