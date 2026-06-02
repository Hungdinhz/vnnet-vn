package com.example.backend_java.service;

import com.example.backend_java.dto.CommentCreateDto;
import com.example.backend_java.dto.CommentResponseDto;
import com.example.backend_java.dto.MessageDto;
import com.example.backend_java.entity.Comment;
import com.example.backend_java.entity.Like;
import com.example.backend_java.entity.Post;
import com.example.backend_java.entity.User;
import com.example.backend_java.repository.CommentRepository;
import com.example.backend_java.repository.LikeRepository;
import com.example.backend_java.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class InteractionService {

    private final LikeRepository likeRepository;
    private final CommentRepository commentRepository;
    private final UserRepository userRepository;

    public InteractionService(LikeRepository likeRepository, CommentRepository commentRepository, UserRepository userRepository) {
        this.likeRepository = likeRepository;
        this.commentRepository = commentRepository;
        this.userRepository = userRepository;
    }

    // Toggle Like (Thích / Bỏ thích) - tương đương crud_interaction.toggle_like
    @Transactional
    public MessageDto toggleLike(Long userId, Long postId, Post post) {
        Optional<Like> existingLike = likeRepository.findByUserIdAndPostId(userId, postId);

        if (existingLike.isPresent()) {
            // Đã like rồi → hủy like
            likeRepository.delete(existingLike.get());
            return new MessageDto("Đã hủy Like bài viết");
        } else {
            // Chưa like → tạo mới
            Like newLike = Like.builder()
                    .userId(userId)
                    .post(post)
                    .build();
            likeRepository.save(newLike);
            return new MessageDto("Đã Like bài viết thành công");
        }
    }

    // Thêm bình luận - tương đương crud_interaction.create_comment
    @Transactional
    public CommentResponseDto createComment(CommentCreateDto dto, Long userId, Long postId, Post post) {
        Comment comment = Comment.builder()
                .content(dto.getContent())
                .userId(userId)
                .post(post)
                .build();

        comment = commentRepository.save(comment);

        User user = userRepository.findById(userId).orElse(null);
        String username = user != null ? user.getUsername() : "Unknown";
        String avatarUrl = user != null ? user.getAvatarUrl() : null;

        return CommentResponseDto.builder()
                .id(comment.getId())
                .content(comment.getContent())
                .userId(comment.getUserId())
                .postId(postId)
                .owner(CommentResponseDto.UserOutDto.builder()
                        .id(userId)
                        .username(username)
                        .avatarUrl(avatarUrl)
                        .build())
                .build();
    }

    // Lấy danh sách bình luận theo post - tương đương crud_interaction.get_comments_by_post
    public List<CommentResponseDto> getCommentsByPost(Long postId) {
        return commentRepository.findByPostId(postId).stream()
                .map(comment -> {
                    User user = userRepository.findById(comment.getUserId()).orElse(null);
                    String username = user != null ? user.getUsername() : "Unknown";
                    String avatarUrl = user != null ? user.getAvatarUrl() : null;

                    return CommentResponseDto.builder()
                            .id(comment.getId())
                            .content(comment.getContent())
                            .userId(comment.getUserId())
                            .postId(postId)
                            .owner(CommentResponseDto.UserOutDto.builder()
                                    .id(comment.getUserId())
                                    .username(username)
                                    .avatarUrl(avatarUrl)
                                    .build())
                            .build();
                })
                .collect(Collectors.toList());
    }
}
