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
}
