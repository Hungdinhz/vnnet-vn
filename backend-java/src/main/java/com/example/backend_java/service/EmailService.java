package com.example.backend_java.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class EmailService {

    private final JavaMailSender mailSender;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;

    @Value("${spring.mail.username:}")
    private String fromEmail;

    @Value("${brevo.api-key:}")
    private String brevoApiKey;

    @Value("${resend.api-key:}")
    private String resendApiKey;

    public EmailService(JavaMailSender mailSender, ObjectMapper objectMapper) {
        this.mailSender = mailSender;
        this.objectMapper = objectMapper != null ? objectMapper : new ObjectMapper();
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();
    }

    @Async("taskExecutor")
    public void sendVerificationEmail(String toEmail, String otpCode) {
        String subject = "Xác nhận đăng ký tài khoản VnNet";
        String content = buildHtmlEmail("Chào mừng đến với VnNet!", "Mã xác nhận đăng ký của bạn là:", otpCode);
        sendHtmlEmail(toEmail, subject, content);
    }

    @Async("taskExecutor")
    public void sendPasswordResetEmail(String toEmail, String otpCode) {
        String subject = "Đặt lại mật khẩu VnNet";
        String content = buildHtmlEmail("Yêu cầu đặt lại mật khẩu", "Mã xác nhận đặt lại mật khẩu của bạn là:", otpCode);
        sendHtmlEmail(toEmail, subject, content);
    }

    private void sendHtmlEmail(String to, String subject, String htmlBody) {
        // 1. Gửi qua Brevo REST API (HTTPS port 443 - hoạt động tốt trên Render Free Tier vì không bị chặn port SMTP)
        if (brevoApiKey != null && !brevoApiKey.isBlank()) {
            boolean success = sendViaBrevo(to, subject, htmlBody);
            if (success) {
                return;
            }
            System.err.println("Brevo API gửi không thành công, kiểm tra các phương thức dự phòng...");
        }

        // 2. Gửi qua Resend REST API (HTTPS port 443)
        if (resendApiKey != null && !resendApiKey.isBlank()) {
            boolean success = sendViaResend(to, subject, htmlBody);
            if (success) {
                return;
            }
            System.err.println("Resend API gửi không thành công, kiểm tra các phương thức dự phòng...");
        }

        // 3. Dự phòng gửi qua JavaMailSender (SMTP) - hoạt động tốt ở Local (port 587)
        if (fromEmail == null || fromEmail.isBlank()) {
            System.err.println("WARN: Chưa cấu hình SPRING_MAIL_USERNAME hoặc BREVO_API_KEY trong cấu hình, không thể gửi email đến: " + to);
            return;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromEmail, "VnNet");
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlBody, true);
            mailSender.send(message);
            System.out.println("Đã gửi email OTP thành công qua SMTP đến: " + to);
        } catch (Exception e) {
            System.err.println("Lỗi khi gửi email SMTP đến " + to + ": " + e.getMessage());
            System.err.println("CHÚ Ý: Render Free Tier chặn tất cả các port SMTP (587, 465, 25). Vui lòng cấu hình biến môi trường BREVO_API_KEY trên Render Dashboard (Environment) để gửi email qua HTTPS port 443!");
            e.printStackTrace();
        }
    }

    private boolean sendViaBrevo(String to, String subject, String htmlBody) {
        try {
            Map<String, Object> payload = new HashMap<>();

            Map<String, String> sender = new HashMap<>();
            sender.put("name", "VnNet");
            sender.put("email", (fromEmail != null && !fromEmail.isBlank()) ? fromEmail.trim() : "hotro.vnnet1@gmail.com");
            payload.put("sender", sender);

            Map<String, String> recipient = new HashMap<>();
            recipient.put("email", to.trim());
            payload.put("to", List.of(recipient));

            payload.put("subject", subject);
            payload.put("htmlContent", htmlBody);

            String requestBody = objectMapper.writeValueAsString(payload);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.brevo.com/v3/smtp/email"))
                    .timeout(Duration.ofSeconds(10))
                    .header("Accept", "application/json")
                    .header("Content-Type", "application/json")
                    .header("api-key", brevoApiKey.trim())
                    .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                System.out.println("Đã gửi email OTP thành công qua Brevo REST API đến: " + to);
                return true;
            } else {
                System.err.println("Gửi qua Brevo API thất bại! Mã HTTP: " + response.statusCode() + ", Phản hồi: " + response.body());
                return false;
            }
        } catch (Exception e) {
            System.err.println("Lỗi kết nối khi gửi email qua Brevo API đến " + to + ": " + e.getMessage());
            e.printStackTrace();
            return false;
        }
    }

    private boolean sendViaResend(String to, String subject, String htmlBody) {
        try {
            Map<String, Object> payload = new HashMap<>();
            String sender = (fromEmail != null && !fromEmail.isBlank() && !fromEmail.endsWith("@gmail.com"))
                    ? "VnNet <" + fromEmail.trim() + ">"
                    : "VnNet <onboarding@resend.dev>";

            payload.put("from", sender);
            payload.put("to", List.of(to.trim()));
            payload.put("subject", subject);
            payload.put("html", htmlBody);

            String requestBody = objectMapper.writeValueAsString(payload);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.resend.com/emails"))
                    .timeout(Duration.ofSeconds(10))
                    .header("Authorization", "Bearer " + resendApiKey.trim())
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                System.out.println("Đã gửi email OTP thành công qua Resend REST API đến: " + to);
                return true;
            } else {
                System.err.println("Gửi qua Resend API thất bại! Mã HTTP: " + response.statusCode() + ", Phản hồi: " + response.body());
                return false;
            }
        } catch (Exception e) {
            System.err.println("Lỗi kết nối khi gửi email qua Resend API đến " + to + ": " + e.getMessage());
            e.printStackTrace();
            return false;
        }
    }

    private String buildHtmlEmail(String title, String description, String otp) {
        return "<div style=\"font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f3f4f6; padding: 20px; border-radius: 10px;\">" +
               "<div style=\"background-color: #4f46e5; padding: 20px; border-radius: 10px 10px 0 0; text-align: center;\">" +
               "<h1 style=\"color: white; margin: 0;\">VnNet</h1>" +
               "</div>" +
               "<div style=\"background-color: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);\">" +
               "<h2 style=\"color: #4f46e5; text-align: center;\">" + title + "</h2>" +
               "<p style=\"color: #374151; font-size: 16px; text-align: center;\">" + description + "</p>" +
               "<div style=\"background-color: #e0e7ff; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0;\">" +
               "<span style=\"font-size: 32px; font-weight: bold; color: #4f46e5; letter-spacing: 5px;\">" + otp + "</span>" +
               "</div>" +
               "<p style=\"color: #6b7280; font-size: 14px; text-align: center;\">Mã này sẽ hết hạn sau 10 phút. Vui lòng không chia sẻ mã này cho bất kỳ ai.</p>" +
               "</div>" +
               "</div>";
    }
}
