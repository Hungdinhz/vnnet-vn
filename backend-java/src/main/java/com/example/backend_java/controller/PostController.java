package com.example.backend_java.controller;

import com.example.backend_java.dto.*;
import com.example.backend_java.entity.Post;
import com.example.backend_java.entity.User;
import com.example.backend_java.service.InteractionService;
import com.example.backend_java.service.NotificationService;
import com.example.backend_java.service.PostService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/posts")
public class PostController {

    private final PostService postService;
    private final InteractionService interactionService;
    private final NotificationService notificationService;

    public PostController(PostService postService, InteractionService interactionService,
                          NotificationService notificationService) {
        this.postService = postService;
        this.interactionService = interactionService;
        this.notificationService = notificationService;
    }

    // POST /posts - Tạo bài viết (cần token)
    @PostMapping("")
    public ResponseEntity<PostResponseDto> createPost(
            @Valid @RequestBody PostCreateDto dto,
            Authentication authentication) {
        User currentUser = (User) authentication.getPrincipal();
        return ResponseEntity.ok(postService.createPost(dto, currentUser));
    }

    // GET /posts - Danh sách bài viết (optional token cho is_liked)
    @GetMapping("")
    public ResponseEntity<List<PostResponseDto>> getPosts(
            @RequestParam(defaultValue = "0") int skip,
            @RequestParam(defaultValue = "100") int limit,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        Long currentUserId = postService.resolveCurrentUserId(authHeader);
        return ResponseEntity.ok(postService.getPosts(skip, limit, currentUserId));
    }

    // GET /posts/{post_id} - Chi tiết bài viết
    @GetMapping("/{postId}")
    public ResponseEntity<PostResponseDto> getPost(@PathVariable Long postId) {
        return ResponseEntity.ok(postService.getPostById(postId));
    }

    // PUT /posts/{post_id} - Sửa bài viết (cần token, chỉ chủ sở hữu)
    @PutMapping("/{postId}")
    public ResponseEntity<PostResponseDto> updatePost(
            @PathVariable Long postId,
            @RequestBody PostUpdateDto dto,
            Authentication authentication) {
        User currentUser = (User) authentication.getPrincipal();
        return ResponseEntity.ok(postService.updatePost(postId, dto, currentUser));
    }

    // DELETE /posts/{post_id} - Xóa bài viết (cần token, chỉ chủ sở hữu)
    @DeleteMapping("/{postId}")
    public ResponseEntity<MessageDto> deletePost(
            @PathVariable Long postId,
            Authentication authentication) {
        User currentUser = (User) authentication.getPrincipal();
        postService.deletePost(postId, currentUser);
        return ResponseEntity.ok(new MessageDto("Bài viết đã được xóa thành công"));
    }

    // POST /posts/{post_id}/like - Toggle like (cần token)
    @PostMapping("/{postId}/like")
    public ResponseEntity<MessageDto> toggleLike(
            @PathVariable Long postId,
            Authentication authentication) {
        User currentUser = (User) authentication.getPrincipal();
        Post post = postService.getPostEntity(postId);

        MessageDto result = interactionService.toggleLike(currentUser.getId(), postId, post);

        // Nếu là hành động LIKE (không phải hủy) thì tạo thông báo
        if ("Đã Like bài viết thành công".equals(result.getMessage())) {
            notificationService.createNotification(
                    post.getOwnerId(), currentUser.getId(), "like", postId);
        }

        return ResponseEntity.ok(result);
    }

    // POST /posts/{post_id}/comments - Thêm bình luận (cần token)
    @PostMapping("/{postId}/comments")
    public ResponseEntity<CommentResponseDto> createComment(
            @PathVariable Long postId,
            @Valid @RequestBody CommentCreateDto dto,
            Authentication authentication) {
        User currentUser = (User) authentication.getPrincipal();
        Post post = postService.getPostEntity(postId);

        CommentResponseDto comment = interactionService.createComment(dto, currentUser.getId(), postId, post);

        // Tạo thông báo cho người viết bài
        notificationService.createNotification(
                post.getOwnerId(), currentUser.getId(), "comment", postId);

        return ResponseEntity.ok(comment);
    }

    // GET /posts/{post_id}/comments - Xem danh sách bình luận
    @GetMapping("/{postId}/comments")
    public ResponseEntity<List<CommentResponseDto>> getComments(@PathVariable Long postId) {
        // Kiểm tra bài viết tồn tại
        postService.getPostEntity(postId);
        return ResponseEntity.ok(interactionService.getCommentsByPost(postId));
    }
}
