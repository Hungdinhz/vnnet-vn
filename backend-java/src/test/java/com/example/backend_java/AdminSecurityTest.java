package com.example.backend_java;

import com.example.backend_java.config.WebSocketAuthInterceptor;
import com.example.backend_java.dto.admin.AdminAuthDtos.LoginStep1Request;
import com.example.backend_java.dto.admin.AdminUserDtos.UpdateUserRoleRequest;
import com.example.backend_java.dto.admin.AdminUserDtos.UpdateUserStatusRequest;
import com.example.backend_java.dto.user.UserResponseDto;
import com.example.backend_java.entity.AccountStatus;
import com.example.backend_java.entity.Role;
import com.example.backend_java.entity.User;
import com.example.backend_java.mapper.UserMapper;
import com.example.backend_java.repository.AdminAuditLogRepository;
import com.example.backend_java.repository.ConversationMemberRepository;
import com.example.backend_java.repository.PostRepository;
import com.example.backend_java.repository.UserRepository;
import com.example.backend_java.repository.VerificationTokenRepository;
import com.example.backend_java.security.JwtAuthenticationFilter;
import com.example.backend_java.security.JwtTokenProvider;
import com.example.backend_java.service.EmailService;
import com.example.backend_java.service.OtpService;
import com.example.backend_java.service.admin.AdminAuditService;
import com.example.backend_java.service.admin.AdminAuthService;
import com.example.backend_java.service.admin.AdminUserService;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageDeliveryException;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.MessageBuilder;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class AdminSecurityTest {

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    private JwtTokenProvider createRealJwtProvider() {
        JwtTokenProvider provider = new JwtTokenProvider();
        ReflectionTestUtils.setField(provider, "jwtSecret", "A_Strong_CSPRNG_Secret_Key_With_At_Least_32_Bytes_Length_12345");
        ReflectionTestUtils.setField(provider, "jwtExpiration", 1800000L);
        ReflectionTestUtils.setField(provider, "jwtAdminExpiration", 1800000L);
        provider.init();
        return provider;
    }

    @Test
    void admin01_userScopedJwtMustBeRejectedOnAdminEndpoints() throws Exception {
        JwtTokenProvider jwtProvider = createRealJwtProvider();
        UserRepository userRepo = mock(UserRepository.class);

        User adminUser = User.builder()
                .id(1L)
                .email("admin@vnnet.vn")
                .username("admin")
                .role(Role.ADMIN)
                .accountStatus(AccountStatus.ACTIVE)
                .isVerified(true)
                .tokenVersion(0)
                .build();
        when(userRepo.findByEmail("admin@vnnet.vn")).thenReturn(Optional.of(adminUser));

        JwtAuthenticationFilter filter = new JwtAuthenticationFilter(jwtProvider, userRepo);
        FilterChain chain = mock(FilterChain.class);

        // 1. User-scoped JWT calling /admin/users -> MUST NOT authenticate
        String userScopedToken = jwtProvider.generateToken("admin@vnnet.vn", 0);
        MockHttpServletRequest req1 = new MockHttpServletRequest("GET", "/admin/users");
        req1.addHeader("Authorization", "Bearer " + userScopedToken);
        MockHttpServletResponse res1 = new MockHttpServletResponse();

        filter.doFilter(req1, res1, chain);
        assertNull(SecurityContextHolder.getContext().getAuthentication());
        assertTrue(res1.getHeader("Cache-Control").contains("no-store"));

        // 2. Admin-scoped JWT calling /admin/users -> MUST authenticate with ROLE_ADMIN
        String adminScopedToken = jwtProvider.generateAdminToken("admin@vnnet.vn", 0, Role.ADMIN);
        MockHttpServletRequest req2 = new MockHttpServletRequest("GET", "/admin/users");
        req2.addHeader("Authorization", "Bearer " + adminScopedToken);
        MockHttpServletResponse res2 = new MockHttpServletResponse();

        filter.doFilter(req2, res2, chain);
        assertNotNull(SecurityContextHolder.getContext().getAuthentication());
        assertTrue(SecurityContextHolder.getContext().getAuthentication().getAuthorities()
                .stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN")));
    }

    @Test
    void admin02_normalUserCannotLoginAdminPortal() {
        UserRepository userRepo = mock(UserRepository.class);
        VerificationTokenRepository tokenRepo = mock(VerificationTokenRepository.class);
        AdminAuditLogRepository auditRepo = mock(AdminAuditLogRepository.class);
        PasswordEncoder encoder = new BCryptPasswordEncoder();
        JwtTokenProvider jwtProvider = createRealJwtProvider();
        OtpService otpService = new OtpService(tokenRepo);
        AdminAuditService auditService = new AdminAuditService(auditRepo, new ObjectMapper());

        User normalUser = User.builder()
                .id(2L)
                .email("normal@vnnet.vn")
                .username("normal")
                .hashedPassword(encoder.encode("StrongPass@123"))
                .role(Role.USER)
                .accountStatus(AccountStatus.ACTIVE)
                .isVerified(true)
                .build();
        when(userRepo.findByEmail("normal@vnnet.vn")).thenReturn(Optional.of(normalUser));

        AdminAuthService authService = new AdminAuthService(
                userRepo, encoder, jwtProvider, otpService, null, auditService);

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> authService.loginStep1(new LoginStep1Request("normal@vnnet.vn", "StrongPass@123")));

        assertEquals(HttpStatus.UNAUTHORIZED, ex.getStatusCode());
        verifyNoInteractions(tokenRepo, auditRepo);
    }

    @Test
    void admin03_bannedOrSuspendedUserBlockedImmediatelyOnHttpAndWebSocket() throws Exception {
        JwtTokenProvider jwtProvider = createRealJwtProvider();
        UserRepository userRepo = mock(UserRepository.class);
        ConversationMemberRepository memberRepo = mock(ConversationMemberRepository.class);

        User bannedUser = User.builder()
                .id(3L)
                .email("banned@vnnet.vn")
                .username("banned")
                .role(Role.USER)
                .accountStatus(AccountStatus.BANNED)
                .banReason("Spam")
                .isVerified(true)
                .tokenVersion(0)
                .build();
        when(userRepo.findByEmail("banned@vnnet.vn")).thenReturn(Optional.of(bannedUser));

        String token = jwtProvider.generateToken("banned@vnnet.vn", 0);

        // HTTP filter blocks banned user
        JwtAuthenticationFilter filter = new JwtAuthenticationFilter(jwtProvider, userRepo);
        MockHttpServletRequest req = new MockHttpServletRequest("GET", "/users/me");
        req.addHeader("Authorization", "Bearer " + token);
        filter.doFilter(req, new MockHttpServletResponse(), mock(FilterChain.class));
        assertNull(SecurityContextHolder.getContext().getAuthentication());

        // WebSocket blocks banned user
        WebSocketAuthInterceptor wsInterceptor = new WebSocketAuthInterceptor(jwtProvider, userRepo, memberRepo);
        StompHeaderAccessor accessor = StompHeaderAccessor.create(StompCommand.CONNECT);
        accessor.addNativeHeader("Authorization", "Bearer " + token);
        Message<?> connectMsg = MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());
        assertThrows(MessageDeliveryException.class, () -> wsInterceptor.preSend(connectMsg, null));
    }

    @Test
    void admin04_safetyInvariantsPreventPrivilegeEscalationAndSelfBan() {
        UserRepository userRepo = mock(UserRepository.class);
        PostRepository postRepo = mock(PostRepository.class);
        AdminAuditLogRepository auditRepo = mock(AdminAuditLogRepository.class);
        AdminAuditService auditService = new AdminAuditService(auditRepo, new ObjectMapper());
        AdminUserService service = new AdminUserService(userRepo, postRepo, auditService);

        User moderator = User.builder().id(10L).email("mod@vnnet.vn").role(Role.MODERATOR).accountStatus(AccountStatus.ACTIVE).isVerified(true).build();
        User admin = User.builder().id(11L).email("admin@vnnet.vn").role(Role.ADMIN).accountStatus(AccountStatus.ACTIVE).isVerified(true).build();
        User superAdmin = User.builder().id(12L).email("super@vnnet.vn").role(Role.SUPER_ADMIN).accountStatus(AccountStatus.ACTIVE).isVerified(true).build();
        User normalUser = User.builder().id(13L).email("u@vnnet.vn").username("u").role(Role.USER).accountStatus(AccountStatus.ACTIVE).isVerified(true).tokenVersion(0).build();

        when(userRepo.findById(10L)).thenReturn(Optional.of(moderator));
        when(userRepo.findById(11L)).thenReturn(Optional.of(admin));
        when(userRepo.findById(12L)).thenReturn(Optional.of(superAdmin));
        when(userRepo.findById(13L)).thenReturn(Optional.of(normalUser));
        when(userRepo.countByRole(Role.SUPER_ADMIN)).thenReturn(1L);

        // Moderator cannot BAN normal user permanently
        assertThrows(ResponseStatusException.class, () ->
                service.updateUserStatus(moderator, 13L, new UpdateUserStatusRequest("BANNED", null, "Test")));

        // Admin cannot suspend SUPER_ADMIN
        assertThrows(ResponseStatusException.class, () ->
                service.updateUserStatus(admin, 12L, new UpdateUserStatusRequest("SUSPENDED", 24, "Test")));

        // Admin cannot self-ban
        assertThrows(ResponseStatusException.class, () ->
                service.updateUserStatus(admin, 11L, new UpdateUserStatusRequest("BANNED", null, "Test")));

        // Non-SUPER_ADMIN cannot change roles
        assertThrows(ResponseStatusException.class, () ->
                service.updateUserRole(admin, 13L, new UpdateUserRoleRequest("ADMIN", "Escalate")));

        // Valid action: Admin bans normal user -> bumps tokenVersion and writes immutable audit log
        service.updateUserStatus(admin, 13L, new UpdateUserStatusRequest("BANNED", null, "Vi phạm nghiêm trọng"));
        assertEquals(AccountStatus.BANNED, normalUser.getAccountStatus());
        assertEquals(1, normalUser.getTokenVersion());
        verify(auditRepo, times(1)).save(argThat(log ->
                "USER_STATUS_BANNED".equals(log.getAction())
                        && "USER".equals(log.getTargetType())
                        && Long.valueOf(13L).equals(log.getTargetId())
                        && "Vi phạm nghiêm trọng".equals(log.getReason())
        ));
    }

    @Test
    void admin05_publicAndSelfUserMapperNeverLeakAdminRole() throws Exception {
        UserMapper mapper = new UserMapper();
        User superAdmin = User.builder()
                .id(1L)
                .username("boss")
                .email("boss@vnnet.vn")
                .role(Role.SUPER_ADMIN)
                .accountStatus(AccountStatus.ACTIVE)
                .isVerified(true)
                .isGuest(false)
                .isPrivate(false)
                .createdAt(LocalDateTime.now())
                .build();

        ObjectMapper json = new ObjectMapper();
        UserResponseDto pubDto = mapper.toPublicResponseDto(superAdmin);
        UserResponseDto selfDto = mapper.toSelfResponseDto(superAdmin);

        String pubJson = json.writeValueAsString(pubDto);
        String selfJson = json.writeValueAsString(selfDto);

        assertFalse(pubJson.contains("SUPER_ADMIN"));
        assertFalse(pubJson.contains("\"role\""));
        assertFalse(selfJson.contains("SUPER_ADMIN"));
        assertFalse(selfJson.contains("\"role\""));
    }
}
