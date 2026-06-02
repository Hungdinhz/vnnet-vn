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
    private final com.example.backend_java.repository.CommentLikeRepository commentLikeRepository;

    public InteractionService(LikeRepository likeRepository, CommentRepository commentRepository, UserRepository userRepository, com.example.backend_java.repository.CommentLikeRepository commentLikeRepository) {
        this.likeRepository = likeRepository;
        this.commentRepository = commentRepository;
        this.userRepository = userRepository;
        this.commentLikeRepository = commentLikeRepository;
    }

    // Toggle Like (Thích / Bỏ thích) bài viết
    @Transactional
    public MessageDto toggleLike(Long userId, Long postId, Post post) {
        Optional<Like> existingLike = likeRepository.findByUserIdAndPostId(userId, postId);

        if (existingLike.isPresent()) {
            likeRepository.delete(existingLike.get());
            return new MessageDto("Đã hủy Like bài viết");
        } else {
            Like newLike = Like.builder()
                    .userId(userId)
                    .post(post)
                    .build();
            likeRepository.save(newLike);
            return new MessageDto("Đã Like bài viết thành công");
        }
    }

    // Toggle Like (Thích / Bỏ thích) bình luận
    @Transactional
    public MessageDto toggleCommentLike(Long userId, Long commentId) {
        Comment comment = commentRepository.findById(commentId)
            .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.NOT_FOUND, "Không tìm thấy bình luận"));
            
        Optional<com.example.backend_java.entity.CommentLike> existingLike = commentLikeRepository.findByCommentIdAndUserId(commentId, userId);

        if (existingLike.isPresent()) {
            commentLikeRepository.delete(existingLike.get());
            return new MessageDto("Đã hủy Like bình luận");
        } else {
            com.example.backend_java.entity.CommentLike newLike = com.example.backend_java.entity.CommentLike.builder()
                    .userId(userId)
                    .comment(comment)
                    .build();
            commentLikeRepository.save(newLike);
            return new MessageDto("Đã Like bình luận thành công");
        }
    }

    // Thêm bình luận
    @Transactional
    public CommentResponseDto createComment(CommentCreateDto dto, Long userId, Long postId, Post post) {
        Comment comment = Comment.builder()
                .content(dto.getContent())
                .userId(userId)
                .post(post)
                .parentId(dto.getParentId())
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
                .parentId(comment.getParentId())
                .likesCount(0)
                .isLiked(false)
                .owner(CommentResponseDto.UserOutDto.builder()
                        .id(userId)
                        .username(username)
                        .avatarUrl(avatarUrl)
                        .build())
                .build();
    }

    // Lấy danh sách bình luận theo post
    public List<CommentResponseDto> getCommentsByPost(Long postId, Long currentUserId) {
        return commentRepository.findByPostId(postId).stream()
                .map(comment -> {
                    User user = userRepository.findById(comment.getUserId()).orElse(null);
                    String username = user != null ? user.getUsername() : "Unknown";
                    String avatarUrl = user != null ? user.getAvatarUrl() : null;

                    int likesCount = comment.getLikes() != null ? comment.getLikes().size() : 0;
                    boolean isLiked = false;
                    if (currentUserId != null && comment.getLikes() != null) {
                        isLiked = comment.getLikes().stream().anyMatch(l -> l.getUserId().equals(currentUserId));
                    }

                    return CommentResponseDto.builder()
                            .id(comment.getId())
                            .content(comment.getContent())
                            .userId(comment.getUserId())
                            .postId(postId)
                            .parentId(comment.getParentId())
                            .likesCount(likesCount)
                            .isLiked(isLiked)
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
