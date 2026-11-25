package com.example.backend_java;

import com.example.backend_java.config.WebSocketAuthInterceptor;
import com.example.backend_java.controller.UploadController;
import com.example.backend_java.dto.auth.GuestResetPasswordDto;
import com.example.backend_java.dto.auth.VerifyOtpDto;
import com.example.backend_java.entity.TokenType;
import com.example.backend_java.entity.User;
import com.example.backend_java.entity.VerificationToken;
import com.example.backend_java.repository.ConversationMemberRepository;
import com.example.backend_java.repository.PendingRegistrationRepository;
import com.example.backend_java.repository.UserRepository;
import com.example.backend_java.repository.VerificationTokenRepository;
import com.example.backend_java.security.JwtTokenProvider;
import com.example.backend_java.service.AuthService;
import com.example.backend_java.service.OtpService;
import com.example.backend_java.util.UrlValidationUtil;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageDeliveryException;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.MessageBuilder;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class SecurityAuditRegressionTest {

    private JwtTokenProvider createRealJwtProvider() {
        JwtTokenProvider provider = new JwtTokenProvider();
        ReflectionTestUtils.setField(provider, "jwtSecret", "A_Strong_CSPRNG_Secret_Key_With_At_Least_32_Bytes_Length_12345");
        ReflectionTestUtils.setField(provider, "jwtExpiration", 1800000L);
        provider.init();
        return provider;
    }

    @Test
    void crit01_verifyEmailMustNotIssueTokenForExistingVerifiedUser() {
        UserRepository userRepo = mock(UserRepository.class);
        PendingRegistrationRepository pendingRepo = mock(PendingRegistrationRepository.class);
        PasswordEncoder encoder = new BCryptPasswordEncoder();
        JwtTokenProvider jwtProvider = createRealJwtProvider();

        when(pendingRepo.findByEmail("victim@example.com")).thenReturn(Optional.empty());
        when(pendingRepo.findByUsername("victim@example.com")).thenReturn(Optional.empty());

        AuthService authService = new AuthService(
                userRepo, pendingRepo, encoder, jwtProvider, null, null, null);

        VerifyOtpDto dto = new VerifyOtpDto();
        dto.setEmail("victim@example.com");
        dto.setOtp("000000");

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () -> authService.verifyEmail(dto));
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatusCode());
    }

    @Test
    void crit02_guestResetPasswordRequiresValidRecoveryKeyAndBumpsTokenVersion() {
        UserRepository userRepo = mock(UserRepository.class);
        PendingRegistrationRepository pendingRepo = mock(PendingRegistrationRepository.class);
        PasswordEncoder encoder = new BCryptPasswordEncoder();
        JwtTokenProvider jwtProvider = createRealJwtProvider();

        String realKey = "VNNET-ABCD-EFGH-2345";
        User guest = User.builder()
                .id(10L)
                .email("guest@example.com")
                .username("guestuser")
                .isGuest(true)
                .isVerified(false)
                .tokenVersion(0)
                .recoveryKeyHash(encoder.encode(realKey))
                .build();

        when(userRepo.findByEmail("guest@example.com")).thenReturn(Optional.of(guest));

        AuthService authService = new AuthService(
                userRepo, pendingRepo, encoder, jwtProvider, null, null, null);

        // Sai recovery key -> bị chặn 400
        GuestResetPasswordDto wrongDto = new GuestResetPasswordDto();
        wrongDto.setEmail("guest@example.com");
        wrongDto.setRecoveryKey("VNNET-WRONG-KEY-0000");
        wrongDto.setNewPassword("StrongPass@123");
        assertThrows(ResponseStatusException.class, () -> authService.guestResetPassword(wrongDto));

        // Đúng recovery key -> thành công và tăng tokenVersion
        GuestResetPasswordDto validDto = new GuestResetPasswordDto();
        validDto.setEmail("guest@example.com");
        validDto.setRecoveryKey(realKey);
        validDto.setNewPassword("StrongPass@123");
        authService.guestResetPassword(validDto);
        assertEquals(1, guest.getTokenVersion());
    }

    @Test
    void crit03_downloadProxyBlocksSsrfAndNonCloudinaryUrls() {
        UploadController controller = new UploadController(null);
        ReflectionTestUtils.setField(controller, "cloudinaryCloudName", "mycloud");

        ResponseEntity<byte[]> metadataRes = controller.downloadFile("http://169.254.169.254/latest/meta-data/", "meta.txt");
        assertEquals(HttpStatus.BAD_REQUEST, metadataRes.getStatusCode());

        ResponseEntity<byte[]> localhostRes = controller.downloadFile("http://127.0.0.1:8000/health", "test.txt");
        assertEquals(HttpStatus.BAD_REQUEST, localhostRes.getStatusCode());

        ResponseEntity<byte[]> foreignCloudRes = controller.downloadFile("https://res.cloudinary.com/othercloud/image/upload/a.png", "a.png");
        assertEquals(HttpStatus.BAD_REQUEST, foreignCloudRes.getStatusCode());
    }

    @Test
    void crit04_websocketBlocksAnonymousConnectAndUnauthorizedConversationSubscribe() {
        JwtTokenProvider jwtProvider = createRealJwtProvider();
        UserRepository userRepo = mock(UserRepository.class);
        ConversationMemberRepository memberRepo = mock(ConversationMemberRepository.class);

        WebSocketAuthInterceptor interceptor = new WebSocketAuthInterceptor(jwtProvider, userRepo, memberRepo);

        // Anonymous CONNECT -> rejected
        StompHeaderAccessor connectAccessor = StompHeaderAccessor.create(StompCommand.CONNECT);
        Message<?> connectMsg = MessageBuilder.createMessage(new byte[0], connectAccessor.getMessageHeaders());
        assertThrows(MessageDeliveryException.class, () -> interceptor.preSend(connectMsg, null));

        // Authenticated user subscribing to another user's conversation -> rejected
        User user = User.builder().id(99L).email("attacker@example.com").build();
        when(memberRepo.existsByConversationIdAndUserId(1L, 99L)).thenReturn(false);

        StompHeaderAccessor subAccessor = StompHeaderAccessor.create(StompCommand.SUBSCRIBE);
        subAccessor.setDestination("/topic/conversation.1");
        subAccessor.setUser(new UsernamePasswordAuthenticationToken(user, null, Collections.emptyList()));
        Message<?> subMsg = MessageBuilder.createMessage(new byte[0], subAccessor.getMessageHeaders());
        assertThrows(MessageDeliveryException.class, () -> interceptor.preSend(subMsg, null));
    }

    @Test
    void crit06_jwtProviderRejectsWeakShortSecretAndPreservesTokenVersion() {
        JwtTokenProvider weakProvider = new JwtTokenProvider();
        ReflectionTestUtils.setField(weakProvider, "jwtSecret", "short_weak_secret");
        ReflectionTestUtils.setField(weakProvider, "jwtExpiration", 1800000L);
        assertThrows(IllegalStateException.class, weakProvider::init);

        JwtTokenProvider strongProvider = createRealJwtProvider();
        String token = strongProvider.generateToken("user@example.com", 7);
        assertTrue(strongProvider.validateToken(token));
        assertEquals("user@example.com", strongProvider.getEmailFromToken(token));
        assertEquals(7, strongProvider.getTokenVersionFromToken(token));
    }

    @Test
    void high03_otpInvalidatedAfterFiveFailedAttempts() {
        VerificationTokenRepository tokenRepo = mock(VerificationTokenRepository.class);
        VerificationToken token = VerificationToken.builder()
                .email("user@example.com")
                .otpCode("654321")
                .tokenType(TokenType.PASSWORD_RESET)
                .expiresAt(LocalDateTime.now().plusMinutes(10))
                .isUsed(false)
                .attemptCount(0)
                .build();

        when(tokenRepo.findTopByEmailAndTokenTypeAndIsUsedFalseOrderByCreatedAtDesc("user@example.com", TokenType.PASSWORD_RESET))
                .thenReturn(Optional.of(token));

        OtpService otpService = new OtpService(tokenRepo);

        for (int i = 0; i < 5; i++) {
            assertThrows(ResponseStatusException.class,
                    () -> otpService.validateOtp("user@example.com", "111111", TokenType.PASSWORD_RESET));
        }
        assertTrue(token.getIsUsed());
        assertEquals(5, token.getAttemptCount());
    }

    @Test
    void med06_urlValidationBlocksJavascriptAndDataSchemes() {
        assertDoesNotThrow(() -> UrlValidationUtil.validateHttpUrlOrNull("https://res.cloudinary.com/demo/image.png", "imageUrl"));
        assertThrows(ResponseStatusException.class, () -> UrlValidationUtil.validateHttpUrlOrNull("javascript:alert(1)", "website"));
        assertThrows(ResponseStatusException.class, () -> UrlValidationUtil.validateHttpUrlOrNull("data:text/html,<script>alert(1)</script>", "imageUrl"));
    }
}
