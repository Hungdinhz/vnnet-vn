package com.example.backend_java.controller;

import com.example.backend_java.service.UploadService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.InetAddress;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.util.Map;

@RestController
@RequestMapping("/upload")
public class UploadController {

    private static final Logger log = LoggerFactory.getLogger(UploadController.class);
    private static final int MAX_DOWNLOAD_BYTES = 20 * 1024 * 1024; // 20 MB ceiling

    private final UploadService uploadService;

    @Value("${cloudinary.cloud-name:}")
    private String cloudinaryCloudName;

    public UploadController(UploadService uploadService) {
        this.uploadService = uploadService;
    }

    // POST /upload - Upload ảnh lên Cloudinary (Yêu cầu đăng nhập)
    @PostMapping("")
    public ResponseEntity<Map<String, String>> uploadImage(@RequestParam("file") MultipartFile file) {
        String url = uploadService.uploadImage(file);
        return ResponseEntity.ok(Map.of("url", url));
    }

    // POST /upload/file - Upload file tài liệu an toàn (Yêu cầu đăng nhập)
    @PostMapping("/file")
    public ResponseEntity<Map<String, Object>> uploadFile(@RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(uploadService.uploadAnyFile(file));
    }

    // GET /upload/download - Proxy tải file an toàn CHỈ cho phép tài nguyên từ Cloudinary của hệ thống (chống SSRF & OOM)
    @GetMapping("/download")
    public ResponseEntity<byte[]> downloadFile(
            @RequestParam("url") String fileUrl,
            @RequestParam(value = "name", required = false) String fileName) {
        try {
            if (fileUrl == null || fileUrl.isBlank()) {
                return ResponseEntity.badRequest().build();
            }

            URI uri = URI.create(fileUrl.trim());
            if (!isAllowedCloudinaryUri(uri)) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
            }

            // Kiểm tra DNS không trỏ vào dải IP nội bộ / loopback / link-local
            InetAddress[] addresses = InetAddress.getAllByName(uri.getHost());
            for (InetAddress addr : addresses) {
                if (addr.isAnyLocalAddress() || addr.isLoopbackAddress()
                        || addr.isLinkLocalAddress() || addr.isSiteLocalAddress()
                        || addr.isMulticastAddress()) {
                    return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
                }
            }

            HttpURLConnection conn = (HttpURLConnection) uri.toURL().openConnection();
            conn.setRequestMethod("GET");
            conn.setConnectTimeout(10000);
            conn.setReadTimeout(30000);
            // Tắt tự động redirect để tránh bypass SSRF qua 302
            conn.setInstanceFollowRedirects(false);

            int status = conn.getResponseCode();
            if (status != 200) {
                return ResponseEntity.status(HttpStatus.BAD_GATEWAY).build();
            }

            long contentLength = conn.getContentLengthLong();
            if (contentLength > MAX_DOWNLOAD_BYTES) {
                return ResponseEntity.status(HttpStatus.PAYLOAD_TOO_LARGE).build();
            }

            byte[] bytes;
            try (InputStream in = conn.getInputStream();
                 ByteArrayOutputStream out = new ByteArrayOutputStream()) {
                byte[] buffer = new byte[8192];
                int totalRead = 0;
                int bytesRead;
                while ((bytesRead = in.read(buffer)) != -1) {
                    totalRead += bytesRead;
                    if (totalRead > MAX_DOWNLOAD_BYTES) {
                        return ResponseEntity.status(HttpStatus.PAYLOAD_TOO_LARGE).build();
                    }
                    out.write(buffer, 0, bytesRead);
                }
                bytes = out.toByteArray();
            }

            String downloadName = (fileName != null && !fileName.trim().isEmpty())
                    ? fileName.trim().replaceAll("[\\r\\n/\\\\]", "_")
                    : "file";

            String contentType = resolveSafeDownloadContentType(downloadName);

            ContentDisposition contentDisposition = ContentDisposition.attachment()
                    .filename(downloadName, StandardCharsets.UTF_8)
                    .build();

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, contentDisposition.toString())
                    .header("X-Content-Type-Options", "nosniff")
                    .contentType(MediaType.parseMediaType(contentType))
                    .contentLength(bytes.length)
                    .body(bytes);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("Lỗi proxy tải file: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    private boolean isAllowedCloudinaryUri(URI uri) {
        if (uri == null || !"https".equalsIgnoreCase(uri.getScheme())) {
            return false;
        }
        String host = uri.getHost();
        if (host == null || !"res.cloudinary.com".equalsIgnoreCase(host)) {
            return false;
        }
        if (uri.getPort() != -1 && uri.getPort() != 443) {
            return false;
        }
        String path = uri.getPath();
        if (path == null || path.contains("..")) {
            return false;
        }
        if (cloudinaryCloudName != null && !cloudinaryCloudName.isBlank()) {
            return path.startsWith("/" + cloudinaryCloudName + "/");
        }
        return true;
    }

    private String resolveSafeDownloadContentType(String downloadName) {
        String lower = downloadName.toLowerCase();
        if (lower.endsWith(".pdf")) return "application/pdf";
        if (lower.endsWith(".docx")) return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
        if (lower.endsWith(".doc")) return "application/msword";
        if (lower.endsWith(".xlsx")) return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
        if (lower.endsWith(".xls")) return "application/vnd.ms-excel";
        if (lower.endsWith(".pptx")) return "application/vnd.openxmlformats-officedocument.presentationml.presentation";
        if (lower.endsWith(".txt")) return "text/plain; charset=UTF-8";
        if (lower.endsWith(".zip")) return "application/zip";
        if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
        if (lower.endsWith(".png")) return "image/png";
        if (lower.endsWith(".webp")) return "image/webp";
        if (lower.endsWith(".gif")) return "image/gif";
        return "application/octet-stream";
    }
}
