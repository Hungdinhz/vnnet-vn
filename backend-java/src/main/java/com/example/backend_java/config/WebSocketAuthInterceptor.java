package com.example.backend_java.config;

import com.example.backend_java.entity.User;
import com.example.backend_java.repository.ConversationMemberRepository;
import com.example.backend_java.repository.UserRepository;
import com.example.backend_java.security.JwtTokenProvider;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.MessageDeliveryException;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class WebSocketAuthInterceptor implements ChannelInterceptor {

    private static final Pattern CONVERSATION_TOPIC_PATTERN =
            Pattern.compile("^/topic/conversation\\.(\\d+)(?:\\.(?:typing|read|info))?$");

    private final JwtTokenProvider jwtTokenProvider;
    private final UserRepository userRepository;
    private final ConversationMemberRepository conversationMemberRepository;

    public WebSocketAuthInterceptor(JwtTokenProvider jwtTokenProvider,
                                    UserRepository userRepository,
                                    ConversationMemberRepository conversationMemberRepository) {
        this.jwtTokenProvider = jwtTokenProvider;
        this.userRepository = userRepository;
        this.conversationMemberRepository = conversationMemberRepository;
    }

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (accessor == null) {
            return message;
        }

        StompCommand command = accessor.getCommand();

        if (StompCommand.CONNECT.equals(command)) {
            String authHeader = accessor.getFirstNativeHeader("Authorization");
            if (authHeader == null) {
                authHeader = accessor.getFirstNativeHeader("token");
            }
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                authHeader = authHeader.substring(7);
            }

            if (authHeader == null || !jwtTokenProvider.validateToken(authHeader)) {
                throw new MessageDeliveryException("Unauthorized: Token WebSocket không hợp lệ hoặc đã hết hạn");
            }

            String email = jwtTokenProvider.getEmailFromToken(authHeader);
            Integer tokenVersion = jwtTokenProvider.getTokenVersionFromToken(authHeader);
            User user = userRepository.findByEmail(email).orElse(null);

            if (user == null) {
                throw new MessageDeliveryException("Unauthorized: Không tìm thấy tài khoản");
            }

            int userTokenVersion = user.getTokenVersion() != null ? user.getTokenVersion() : 0;
            boolean accountActive = Boolean.TRUE.equals(user.getIsVerified()) || Boolean.TRUE.equals(user.getIsGuest());
            if (!accountActive || tokenVersion == null || tokenVersion != userTokenVersion) {
                throw new MessageDeliveryException("Unauthorized: Phiên đăng nhập đã bị thu hồi");
            }

            // Use email as the principal name so that convertAndSendToUser matches correctly
            UsernamePasswordAuthenticationToken auth =
                    new UsernamePasswordAuthenticationToken(user, null, Collections.emptyList()) {
                        @Override
                        public String getName() {
                            return user.getEmail();
                        }
                    };
            accessor.setUser(auth);
        } else if (StompCommand.SUBSCRIBE.equals(command)) {
            User user = extractAuthenticatedUser(accessor);
            if (user == null) {
                throw new MessageDeliveryException("Unauthorized: Vui lòng xác thực trước khi đăng ký kênh");
            }

            String destination = accessor.getDestination();
            if (destination == null || destination.contains("*")) {
                throw new MessageDeliveryException("Forbidden: Đích đăng ký không hợp lệ");
            }

            if (destination.startsWith("/topic/conversation.")) {
                Matcher matcher = CONVERSATION_TOPIC_PATTERN.matcher(destination);
                if (!matcher.matches()) {
                    throw new MessageDeliveryException("Forbidden: Kênh cuộc trò chuyện không hợp lệ");
                }
                Long conversationId = Long.parseLong(matcher.group(1));
                boolean isMember = conversationMemberRepository.existsByConversationIdAndUserId(conversationId, user.getId());
                if (!isMember) {
                    throw new MessageDeliveryException("Forbidden: Bạn không thuộc cuộc trò chuyện này");
                }
            }
        } else if (StompCommand.SEND.equals(command)) {
            User user = extractAuthenticatedUser(accessor);
            if (user == null) {
                throw new MessageDeliveryException("Unauthorized: Vui lòng xác thực trước khi gửi tin nhắn");
            }
        }

        return message;
    }

    private User extractAuthenticatedUser(StompHeaderAccessor accessor) {
        if (accessor.getUser() instanceof UsernamePasswordAuthenticationToken auth
                && auth.getPrincipal() instanceof User user) {
            return user;
        }
        return null;
    }
}
