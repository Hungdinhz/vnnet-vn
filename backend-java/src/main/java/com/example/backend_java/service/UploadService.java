package com.example.backend_java.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.util.Map;
import java.util.Set;

@Service
public class UploadService {

    private static final Logger log = LoggerFactory.getLogger(UploadService.class);

    private static final Set<String> ALLOWED_IMAGE_MIMES = Set.of(
            "image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"
    );

    private static final Set<String> ALLOWED_FILE_EXTENSIONS = Set.of(
            "jpg", "jpeg", "png", "gif", "webp",
            "pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx",
            "txt", "csv", "zip", "mp3", "wav", "ogg", "mp4", "webm"
    );

    private final Cloudinary cloudinary;

    public UploadService(Cloudinary cloudinary) {
        this.cloudinary = cloudinary;
    }

    // Upload ảnh lên Cloudinary - kiểm tra MIME và magic bytes (chặn SVG / giả mạo header)
    @SuppressWarnings("unchecked")
    public String uploadImage(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "File ảnh không được để trống");
        }

        String contentType = file.getContentType() != null ? file.getContentType().toLowerCase() : "";
        if (!ALLOWED_IMAGE_MIMES.contains(contentType)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Chỉ hỗ trợ ảnh định dạng JPG, PNG, GIF hoặc WEBP");
        }

        try {
            byte[] bytes = file.getBytes();
            if (!hasValidImageMagicBytes(bytes)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Nội dung tệp không phải là ảnh hợp lệ");
            }

            Map<String, Object> result = cloudinary.uploader().upload(bytes, ObjectUtils.asMap("resource_type", "image"));
            return (String) result.get("secure_url");
        } catch (ResponseStatusException e) {
            throw e;
        } catch (IOException e) {
            log.error("Lỗi Cloudinary khi upload ảnh: {}", e.getMessage());
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Lỗi khi upload ảnh lên mây");
        }
    }

    // Upload tài liệu/media theo danh sách định dạng được phép (chặn HTML, SVG, EXE, JS...)
    @SuppressWarnings("unchecked")
    public Map<String, Object> uploadAnyFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "File không được để trống");
        }

        String originalFilename = file.getOriginalFilename() != null ? file.getOriginalFilename().trim() : "";
        String extension = extractExtension(originalFilename);
        if (extension.isEmpty() || !ALLOWED_FILE_EXTENSIONS.contains(extension)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Định dạng tệp không được hỗ trợ vì lý do bảo mật");
        }

        String contentType = file.getContentType() != null ? file.getContentType().toLowerCase() : "";
        if (contentType.contains("svg") || contentType.contains("html") || contentType.contains("javascript")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Loại tệp này không được phép tải lên");
        }

        try {
            byte[] bytes = file.getBytes();
            if (ALLOWED_IMAGE_MIMES.contains(contentType) && !hasValidImageMagicBytes(bytes)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Nội dung ảnh không hợp lệ");
            }

            long size = file.getSize();
            String resourceType = "auto";
            if (!contentType.startsWith("image/") && !contentType.startsWith("video/") && !contentType.startsWith("audio/")) {
                resourceType = "raw";
            }

            java.util.Map<String, Object> params = new java.util.HashMap<>();
            params.put("resource_type", resourceType);

            if ("raw".equals(resourceType)) {
                String safeId = "doc_" + java.util.UUID.randomUUID().toString().replace("-", "") + ".cld";
                params.put("public_id", safeId);
                params.put("use_filename", false);
                params.put("unique_filename", false);
            } else {
                params.put("use_filename", false);
                params.put("unique_filename", true);
            }

            Map<String, Object> result = cloudinary.uploader().upload(bytes, params);

            String url = (String) result.get("secure_url");
            if (url == null) {
                url = (String) result.get("url");
            }

            String safeFileName = originalFilename.replaceAll("[\\r\\n/\\\\]", "_");
            return Map.of(
                    "url", url != null ? url : "",
                    "fileName", !safeFileName.isEmpty() ? safeFileName : "file",
                    "fileSize", size
            );
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            log.error("Lỗi Cloudinary khi upload file: {}", e.getMessage());
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Lỗi khi upload file lên mây");
        }
    }

    private String extractExtension(String filename) {
        int idx = filename.lastIndexOf('.');
        if (idx < 0 || idx == filename.length() - 1) {
            return "";
        }
        return filename.substring(idx + 1).toLowerCase();
    }

    private boolean hasValidImageMagicBytes(byte[] data) {
        if (data == null || data.length < 12) return false;
        // JPEG: FF D8 FF
        if ((data[0] & 0xFF) == 0xFF && (data[1] & 0xFF) == 0xD8 && (data[2] & 0xFF) == 0xFF) return true;
        // PNG: 89 50 4E 47 0D 0A 1A 0A
        if ((data[0] & 0xFF) == 0x89 && data[1] == 0x50 && data[2] == 0x4E && data[3] == 0x47) return true;
        // GIF: GIF87a / GIF89a
        if (data[0] == 'G' && data[1] == 'I' && data[2] == 'F' && data[3] == '8') return true;
        // WEBP: RIFF....WEBP
        if (data[0] == 'R' && data[1] == 'I' && data[2] == 'F' && data[3] == 'F'
                && data[8] == 'W' && data[9] == 'E' && data[10] == 'B' && data[11] == 'P') return true;
        return false;
    }
}
