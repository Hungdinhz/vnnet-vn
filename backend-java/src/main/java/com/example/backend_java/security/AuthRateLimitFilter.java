package com.example.backend_java.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpMethod;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Rate limit cho các endpoint xác thực nhạy cảm nhằm chống brute-force mật khẩu & OTP.
 */
@Component
public class AuthRateLimitFilter extends OncePerRequestFilter {

    private final RateLimitService rateLimitService;

    public AuthRateLimitFilter(RateLimitService rateLimitService) {
        this.rateLimitService = rateLimitService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        if (!HttpMethod.POST.matches(request.getMethod())) {
            filterChain.doFilter(request, response);
            return;
        }

        String path = request.getRequestURI();
        String clientIp = extractClientIp(request);

        boolean allowed = true;
        if (path.endsWith("/login")) {
            allowed = rateLimitService.isAllowed("login:" + clientIp, 15, 300);
        } else if (path.endsWith("/verify-email") || path.endsWith("/verify-otp")
                || path.endsWith("/reset-password") || path.endsWith("/guest/reset-password")) {
            allowed = rateLimitService.isAllowed("verify:" + clientIp, 10, 300);
        } else if (path.endsWith("/forgot-password") || path.endsWith("/resend-otp")
                || path.endsWith("/register") || path.endsWith("/guest/register")
                || path.endsWith("/google/register")) {
            allowed = rateLimitService.isAllowed("reg_otp:" + clientIp, 10, 600);
        }

        if (!allowed) {
            response.setStatus(429);
            response.setContentType("application/json");
            response.setCharacterEncoding("UTF-8");
            response.getWriter().write("{\"detail\":\"Bạn gửi quá nhiều yêu cầu. Vui lòng thử lại sau ít phút.\"}");
            return;
        }

        filterChain.doFilter(request, response);
    }

    private String extractClientIp(HttpServletRequest request) {
        String xff = request.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) {
            return xff.split(",")[0].trim();
        }
        return request.getRemoteAddr() != null ? request.getRemoteAddr() : "unknown";
    }
}
