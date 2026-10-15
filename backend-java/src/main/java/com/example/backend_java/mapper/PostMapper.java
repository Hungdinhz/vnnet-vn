package com.example.backend_java.mapper;

import com.example.backend_java.dto.post.PostResponseDto;
import com.example.backend_java.entity.Post;
import com.example.backend_java.entity.User;
import com.example.backend_java.repository.CommentRepository;
import com.example.backend_java.repository.LikeRepository;
import com.example.backend_java.repository.PostMentionRepository;
import com.example.backend_java.repository.UserRepository;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.stream.Collectors;

@Component
public class PostMapper {

    private final LikeRepository likeRepository;
    private final CommentRepository commentRepository;
    private final PostMentionRepository postMentionRepository;
    private final UserRepository userRepository;

    public PostMapper(LikeRepository likeRepository,
                      CommentRepository commentRepository,
                      PostMentionRepository postMentionRepository,
                      UserRepository userRepository) {
        this.likeRepository = likeRepository;
        this.commentRepository = commentRepository;
        this.postMentionRepository = postMentionRepository;
        this.userRepository = userRepository;
    }

    public PostResponseDto toResponseDto(Post post, Long currentUserId) {
        long likesCount = likeRepository.countByPostId(post.getId());
        long commentsCount = commentRepository.countByPostId(post.getId());
        boolean isLiked = currentUserId != null && likeRepository.existsByUserIdAndPostId(currentUserId, post.getId());

        // Build reactions summary map
        Map<String, Integer> reactionsSummary = new LinkedHashMap<>();
        List<Object[]> reactionCounts = likeRepository.countReactionsByPostId(post.getId());
        for (Object[] row : reactionCounts) {
            String type = (String) row[0];
            int count = ((Number) row[1]).intValue();
            reactionsSummary.put(type != null ? type : "like", count);
        }

        // Get current user's reaction
        String myReaction = null;
        if (currentUserId != null) {
            var myLike = likeRepository.findByUserIdAndPostId(currentUserId, post.getId());
            if (myLike.isPresent()) {
                myReaction = myLike.get().getReactionType();
            }
        }

        // Get mentioned users
        List<PostResponseDto.UserOutDto> mentionedUsers = postMentionRepository.findByPostId(post.getId()).stream()
                .map(m -> {
                    User mu = userRepository.findById(m.getMentionedUserId()).orElse(null);
                    if (mu == null) return null;
                    return PostResponseDto.UserOutDto.builder()
                            .id(mu.getId())
                            .username(mu.getUsername())
                            .avatarUrl(mu.getAvatarUrl())
                            .build();
                })
                .filter(Objects::nonNull)
                .collect(Collectors.toList());

        User owner = post.getOwner();

        PostResponseDto sharedPostDto = null;
        if (post.getSharedPost() != null) {
            Post sp = post.getSharedPost();
            User spOwner = sp.getOwner();
            sharedPostDto = PostResponseDto.builder()
                    .id(sp.getId())
                    .title(sp.getTitle())
                    .content(sp.getContent())
                    .imageUrl(sp.getImageUrl())
                    .createdAt(sp.getCreatedAt())
                    .ownerId(spOwner.getId())
                    .owner(PostResponseDto.UserOutDto.builder()
                            .id(spOwner.getId())
                            .username(spOwner.getUsername())
                            .avatarUrl(spOwner.getAvatarUrl())
                            .build())
                    .build();
        }

        return PostResponseDto.builder()
                .id(post.getId())
                .title(post.getTitle())
                .content(post.getContent())
                .imageUrl(post.getImageUrl())
                .createdAt(post.getCreatedAt())
                .ownerId(owner.getId())
                .owner(PostResponseDto.UserOutDto.builder()
                        .id(owner.getId())
                        .username(owner.getUsername())
                        .avatarUrl(owner.getAvatarUrl())
                        .build())
                .likesCount((int) likesCount)
                .commentsCount((int) commentsCount)
                .isLiked(isLiked)
                .myReaction(myReaction)
                .reactionsSummary(reactionsSummary)
                .sharedPost(sharedPostDto)
                .groupId(post.getGroup() != null ? post.getGroup().getId() : null)
                .groupName(post.getGroup() != null ? post.getGroup().getName() : null)
                .mentionedUsers(mentionedUsers.isEmpty() ? null : mentionedUsers)
                .visibility(post.getVisibility() != null ? post.getVisibility() : "public")
                .build();
    }
}
