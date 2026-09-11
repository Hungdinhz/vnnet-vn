package com.example.backend_java.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    @Async
    public void sendVerificationEmail(String toEmail, String otpCode) {
        String subject = "Xác nhận đăng ký tài khoản VnNet";
        String content = buildHtmlEmail("Chào mừng đến với VnNet!", "Mã xác nhận đăng ký của bạn là:", otpCode);
        sendHtmlEmail(toEmail, subject, content);
    }

    @Async
    public void sendPasswordResetEmail(String toEmail, String otpCode) {
        String subject = "Đặt lại mật khẩu VnNet";
        String content = buildHtmlEmail("Yêu cầu đặt lại mật khẩu", "Mã xác nhận đặt lại mật khẩu của bạn là:", otpCode);
        sendHtmlEmail(toEmail, subject, content);
    }

    private void sendHtmlEmail(String to, String subject, String htmlBody) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromEmail);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlBody, true);
            mailSender.send(message);
        } catch (MessagingException e) {
            System.err.println("Lỗi khi gửi email đến " + to + ": " + e.getMessage());
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
