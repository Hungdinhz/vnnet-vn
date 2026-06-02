package com.example.backend_java.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.util.Map;

@Service
public class UploadService {

    private final Cloudinary cloudinary;

    public UploadService(Cloudinary cloudinary) {
        this.cloudinary = cloudinary;
    }

    // Upload ảnh lên Cloudinary - tương đương upload_image trong Python
    @SuppressWarnings("unchecked")
    public String uploadImage(MultipartFile file) {
        // Kiểm tra loại file
        if (file.getContentType() == null || !file.getContentType().startsWith("image/")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Chỉ hỗ trợ upload file ảnh");
        }

        try {
            // Upload lên Cloudinary
            Map<String, Object> result = cloudinary.uploader().upload(file.getBytes(), ObjectUtils.emptyMap());

            // Trả về URL vĩnh viễn
            return (String) result.get("secure_url");
        } catch (IOException e) {
            System.out.println("Lỗi Cloudinary: " + e.getMessage());
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Lỗi khi upload ảnh lên mây");
        }
    }
}
