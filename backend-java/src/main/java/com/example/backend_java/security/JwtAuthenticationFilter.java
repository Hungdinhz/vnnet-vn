package com.example.backend_java.security;

import com.example.backend_java.entity.AccountStatus;
import com.example.backend_java.entity.Role;
import com.example.backend_java.entity.User;
import com.example.backend_java.repository.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenProvider jwtTokenProvider;
    private final UserRepository userRepository;

    public JwtAuthenticationFilter(JwtTokenProvider jwtTokenProvider, UserRepository userRepository) {
        this.jwtTokenProvider = jwtTokenProvider;
        this.userRepository = userRepository;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        String path = request.getRequestURI();
        boolean isAdminApi = path != null && (path.equals("/admin") || path.startsWith("/admin/"));
        if (isAdminApi) {
            // Không bao giờ cho phép trình duyệt hoặc proxy cache dữ liệu quản trị
            response.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private");
            response.setHeader("Pragma", "no-cache");
        }

        // Lấy token từ header Authorization: Bearer <token>
        String token = getTokenFromRequest(request);

        if (StringUtils.hasText(token) && jwtTokenProvider.validateToken(token)) {
            String email = jwtTokenProvider.getEmailFromToken(token);
            Integer tokenVersion = jwtTokenProvider.getTokenVersionFromToken(token);
            String scope = jwtTokenProvider.getScopeFromToken(token);

            // Challenge token chỉ dùng cho bước 2 login admin, không được phép xác thực API thường
            if (JwtTokenProvider.SCOPE_ADMIN_OTP_PENDING.equals(scope)) {
                filterChain.doFilter(request, response);
                return;
            }

            User user = userRepository.findByEmail(email).orElse(null);

            if (user != null) {
                // Tự động phục hồi nếu tạm khóa (SUSPENDED) đã hết hạn
                if (user.getEffectiveAccountStatus() == AccountStatus.SUSPENDED
                        && user.getBannedUntil() != null
                        && user.getBannedUntil().isBefore(LocalDateTime.now())) {
                    user.setAccountStatus(AccountStatus.ACTIVE);
                    user.setBannedUntil(null);
                    user.setBanReason(null);
                    userRepository.save(user);
                }

                int userTokenVersion = user.getTokenVersion() != null ? user.getTokenVersion() : 0;
                boolean accountActive = (Boolean.TRUE.equals(user.getIsVerified()) || Boolean.TRUE.equals(user.getIsGuest()))
                        && !user.isCurrentlyRestricted();

                Role effectiveRole = user.getEffectiveRole();

                // TÁCH BIỆT PHIÊN: Mọi endpoint /admin/** bắt buộc JWT có scope=ADMIN và role staff trong DB
                boolean scopeAllowed = isAdminApi
                        ? (JwtTokenProvider.SCOPE_ADMIN.equals(scope) && effectiveRole.isStaff())
                        : (JwtTokenProvider.SCOPE_USER.equals(scope) || JwtTokenProvider.SCOPE_ADMIN.equals(scope));

                if (accountActive && scopeAllowed && tokenVersion != null && tokenVersion == userTokenVersion) {
                    List<SimpleGrantedAuthority> authorities = List.of(
                            new SimpleGrantedAuthority("ROLE_" + effectiveRole.name())
                    );
                    UsernamePasswordAuthenticationToken authentication =
                            new UsernamePasswordAuthenticationToken(user, null, authorities);
                    authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                    SecurityContextHolder.getContext().setAuthentication(authentication);
                }
            }
        }

        filterChain.doFilter(request, response);
    }

    private String getTokenFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }
}
