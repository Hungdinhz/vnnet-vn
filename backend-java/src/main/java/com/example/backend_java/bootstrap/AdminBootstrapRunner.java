package com.example.backend_java.bootstrap;

import com.example.backend_java.entity.AccountStatus;
import com.example.backend_java.entity.Role;
import com.example.backend_java.entity.User;
import com.example.backend_java.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

/**
 * Khởi tạo tài khoản SUPER_ADMIN đầu tiên một cách an toàn qua biến môi trường.
 * Chỉ chạy khi trong cơ sở dữ liệu chưa có bất kỳ SUPER_ADMIN nào.
 */
@Component
@Order(2)
@RequiredArgsConstructor
@Slf4j
public class AdminBootstrapRunner implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${admin.bootstrap.email:}")
    private String bootstrapEmail;

    @Value("${admin.bootstrap.password:}")
    private String bootstrapPassword;

    @Override
    public void run(String... args) {
        if (bootstrapEmail == null || bootstrapEmail.isBlank()) {
            return;
        }

        if (userRepository.countByRole(Role.SUPER_ADMIN) > 0) {
            log.info("SUPER_ADMIN already exists. Skipping AdminBootstrapRunner.");
            return;
        }

        if (bootstrapPassword == null || bootstrapPassword.length() < 12) {
            log.error("ADMIN_BOOTSTRAP_PASSWORD phải dài tối thiểu 12 ký tự. Bỏ qua khởi tạo SUPER_ADMIN.");
            return;
        }

        String normalizedEmail = bootstrapEmail.trim().toLowerCase();
        User user = userRepository.findByEmail(normalizedEmail).orElse(null);

        if (user != null) {
            user.setRole(Role.SUPER_ADMIN);
            user.setAccountStatus(AccountStatus.ACTIVE);
            user.setIsVerified(true);
            user.setIsGuest(false);
            if (user.getHashedPassword() == null || user.getHashedPassword().isBlank()) {
                user.setHashedPassword(passwordEncoder.encode(bootstrapPassword));
            }
            userRepository.save(user);
            log.warn("SECURITY NOTICE: Đã nâng cấp tài khoản {} lên SUPER_ADMIN. Vui lòng xóa biến môi trường ADMIN_BOOTSTRAP_* sau khi khởi tạo.", normalizedEmail);
        } else {
            String baseUsername = normalizedEmail.split("@")[0].replaceAll("[^a-zA-Z0-9_]", "");
            if (baseUsername.length() < 3) {
                baseUsername = "superadmin";
            }
            String username = userRepository.existsByUsernameIgnoreCase(baseUsername)
                    ? baseUsername + "_admin"
                    : baseUsername;

            User superAdmin = User.builder()
                    .email(normalizedEmail)
                    .username(username)
                    .fullName("System Super Admin")
                    .hashedPassword(passwordEncoder.encode(bootstrapPassword))
                    .role(Role.SUPER_ADMIN)
                    .accountStatus(AccountStatus.ACTIVE)
                    .isVerified(true)
                    .isGuest(false)
                    .isPrivate(true)
                    .tokenVersion(0)
                    .createdAt(LocalDateTime.now())
                    .build();

            userRepository.save(superAdmin);
            log.warn("SECURITY NOTICE: Đã tạo tài khoản SUPER_ADMIN mới ({}). Vui lòng xóa biến môi trường ADMIN_BOOTSTRAP_* sau khi khởi tạo.", normalizedEmail);
        }
    }
}
