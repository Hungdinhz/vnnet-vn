package com.example.backend_java.controller;

import com.example.backend_java.service.UploadService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/upload")
public class UploadController {

    private final UploadService uploadService;

    public UploadController(UploadService uploadService) {
        this.uploadService = uploadService;
    }

    // POST /upload - Upload ảnh lên Cloudinary
    @PostMapping("")
    public ResponseEntity<Map<String, String>> uploadImage(@RequestParam("file") MultipartFile file) {
        String url = uploadService.uploadImage(file);
        return ResponseEntity.ok(Map.of("url", url));
    }

    // POST /upload/file - Upload file bất kỳ (tài liệu, pdf, zip, v.v.)
    @PostMapping("/file")
    public ResponseEntity<Map<String, Object>> uploadFile(@RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(uploadService.uploadAnyFile(file));
    }

    // GET /upload/download - Proxy tải file an toàn, bypass CORS và đặt Content-Disposition attachment
    @GetMapping("/download")
    public ResponseEntity<byte[]> downloadFile(
            @RequestParam("url") String fileUrl,
            @RequestParam(value = "name", required = false) String fileName) {
        try {
            if (fileUrl == null || (!fileUrl.startsWith("http://") && !fileUrl.startsWith("https://"))) {
                return ResponseEntity.badRequest().build();
            }

            java.net.URI uri = java.net.URI.create(fileUrl);
            java.net.HttpURLConnection conn = (java.net.HttpURLConnection) uri.toURL().openConnection();
            conn.setRequestMethod("GET");
            conn.setConnectTimeout(15000);
            conn.setReadTimeout(60000);
            conn.setInstanceFollowRedirects(true);

            int status = conn.getResponseCode();
            if (status != 200) {
                return ResponseEntity.status(status).build();
            }

            byte[] bytes = conn.getInputStream().readAllBytes();
            String downloadName = (fileName != null && !fileName.trim().isEmpty())
                    ? fileName.trim()
                    : "file";

            String contentType = conn.getContentType();
            if (contentType == null || contentType.isEmpty() || "application/octet-stream".equals(contentType)) {
                String lower = downloadName.toLowerCase();
                if (lower.endsWith(".pdf")) {
                    contentType = "application/pdf";
                } else if (lower.endsWith(".docx")) {
                    contentType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
                } else if (lower.endsWith(".doc")) {
                    contentType = "application/msword";
                } else if (lower.endsWith(".xlsx")) {
                    contentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
                } else if (lower.endsWith(".xls")) {
                    contentType = "application/vnd.ms-excel";
                } else if (lower.endsWith(".pptx")) {
                    contentType = "application/vnd.openxmlformats-officedocument.presentationml.presentation";
                } else if (lower.endsWith(".txt")) {
                    contentType = "text/plain; charset=UTF-8";
                } else if (lower.endsWith(".zip")) {
                    contentType = "application/zip";
                } else {
                    contentType = "application/octet-stream";
                }
            }

            org.springframework.http.ContentDisposition contentDisposition =
                    org.springframework.http.ContentDisposition.attachment()
                            .filename(downloadName, java.nio.charset.StandardCharsets.UTF_8)
                            .build();

            return ResponseEntity.ok()
                    .header(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION, contentDisposition.toString())
                    .contentType(org.springframework.http.MediaType.parseMediaType(contentType))
                    .contentLength(bytes.length)
                    .body(bytes);
        } catch (Exception e) {
            System.err.println("Lỗi proxy tải file: " + e.getMessage());
            return ResponseEntity.status(org.springframework.http.HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
