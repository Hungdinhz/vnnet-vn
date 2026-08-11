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

    // Toggle Reaction (React / Đổi loại / Bỏ react) bài viết
    @Transactional
    public MessageDto toggleReaction(Long userId, Long postId, Post post, String reactionType) {
        if (reactionType == null || reactionType.isBlank()) {
            reactionType = "like";
        }

        Optional<Like> existingLike = likeRepository.findByUserIdAndPostId(userId, postId);

        if (existingLike.isPresent()) {
            Like like = existingLike.get();
            // Null-safe: treat null reactionType as "like"
            String currentType = like.getReactionType() != null ? like.getReactionType() : "like";
            if (currentType.equals(reactionType)) {
                // Same reaction → toggle off (remove)
                likeRepository.delete(like);
                return new MessageDto("Đã bỏ reaction bài viết");
            } else {
                // Different reaction → update
                like.setReactionType(reactionType);
                likeRepository.save(like);
                return new MessageDto("Đã đổi reaction thành " + reactionType);
            }
        } else {
            // No existing reaction → create new
            Like newLike = Like.builder()
                    .userId(userId)
                    .post(post)
                    .reactionType(reactionType)
                    .build();
            likeRepository.save(newLike);
            return new MessageDto("Đã react " + reactionType + " bài viết");
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
    @Transactional(readOnly = true)
    public List<CommentResponseDto> getCommentsByPost(Long postId, Long currentUserId) {
        return commentRepository.findByPostId(postId).stream()
                .map(comment -> {
                    User user = userRepository.findById(comment.getUserId()).orElse(null);
                    String username = user != null ? user.getUsername() : "Unknown";
                    String avatarUrl = user != null ? user.getAvatarUrl() : null;

                    int likesCount = comment.getLikes() != null ? comment.getLikes().size() : 0;
                    boolean isLiked = false;
                    if (currentUserId != null && comment.getLikes() != null) {
                        isLiked = comment.getLikes().stream().anyMatch(l -> java.util.Objects.equals(l.getUserId(), currentUserId));
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
