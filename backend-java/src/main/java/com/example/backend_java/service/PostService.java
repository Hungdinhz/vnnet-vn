package com.example.backend_java.service;

import com.example.backend_java.dto.*;
import com.example.backend_java.entity.Post;
import com.example.backend_java.entity.PostMention;
import com.example.backend_java.entity.User;
import com.example.backend_java.repository.*;
import com.example.backend_java.security.JwtTokenProvider;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class PostService {

    private final PostRepository postRepository;
    private final LikeRepository likeRepository;
    private final CommentRepository commentRepository;
    private final UserRepository userRepository;
    private final JwtTokenProvider jwtTokenProvider;
    private final FriendshipRepository friendshipRepository;
    private final GroupRepository groupRepository;
    private final GroupMemberRepository groupMemberRepository;
    private final PostMentionRepository postMentionRepository;
    private final NotificationService notificationService;

    public PostService(PostRepository postRepository, LikeRepository likeRepository,
                       CommentRepository commentRepository, UserRepository userRepository,
                       JwtTokenProvider jwtTokenProvider, FriendshipRepository friendshipRepository,
                       GroupRepository groupRepository, GroupMemberRepository groupMemberRepository,
                       PostMentionRepository postMentionRepository, NotificationService notificationService) {
        this.postRepository = postRepository;
        this.likeRepository = likeRepository;
        this.commentRepository = commentRepository;
        this.userRepository = userRepository;
        this.jwtTokenProvider = jwtTokenProvider;
        this.friendshipRepository = friendshipRepository;
        this.groupRepository = groupRepository;
        this.groupMemberRepository = groupMemberRepository;
        this.postMentionRepository = postMentionRepository;
        this.notificationService = notificationService;
    }

    // Tạo bài viết mới (tương đương crud_post.create_post)
    public PostResponseDto createPost(PostCreateDto dto, User currentUser) {
        Post sharedPost = null;
        if (dto.getSharedPostId() != null) {
            sharedPost = postRepository.findById(dto.getSharedPostId())
                    .orElseThrow(() -> new ResponseStatusException(org.springframework.http.HttpStatus.NOT_FOUND, "Không tìm thấy bài viết để chia sẻ"));
        }

        com.example.backend_java.entity.Group group = null;
        if (dto.getGroupId() != null) {
            group = groupRepository.findById(dto.getGroupId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Nhóm không tồn tại"));
        }

        Post post = Post.builder()
                .title(dto.getTitle())
                .content(dto.getContent())
                .imageUrl(dto.getImageUrl())
                .owner(currentUser)
                .sharedPostId(dto.getSharedPostId())
                .sharedPost(sharedPost)
                .group(group)
                .build();

        post = postRepository.save(post);

        // Lưu mentions (tag bạn bè)
        if (dto.getMentionedUserIds() != null && !dto.getMentionedUserIds().isEmpty()) {
            for (Long mentionedUserId : dto.getMentionedUserIds()) {
                if (!mentionedUserId.equals(currentUser.getId())) {
                    PostMention mention = PostMention.builder()
                            .post(post)
                            .mentionedUserId(mentionedUserId)
                            .build();
                    postMentionRepository.save(mention);
                    // Gửi thông báo cho người được tag
                    notificationService.createNotification(
                            mentionedUserId, currentUser.getId(), "mention", post.getId());
                }
            }
        }

        return toResponseDto(post, currentUser.getId());
    }

    // Lấy danh sách bài viết (tương đương crud_post.get_posts)
    // currentUserId có thể null nếu chưa đăng nhập
    public PagedResponseDto<PostResponseDto> getPosts(int page, int size, Long currentUserId) {
        List<Post> posts = postRepository.findAllByOrderByIdDesc();

        java.util.Set<Long> joinedGroupIds = new java.util.HashSet<>();
        if (currentUserId != null) {
            joinedGroupIds = groupMemberRepository.findByUserId(currentUserId).stream()
                    .map(com.example.backend_java.entity.GroupMember::getGroupId)
                    .collect(Collectors.toSet());
        }

        final java.util.Set<Long> finalJoinedGroupIds = joinedGroupIds;
        List<PostResponseDto> dtos = posts.stream()
                .filter(post -> post.getGroupId() == null || finalJoinedGroupIds.contains(post.getGroupId()))
                .map(post -> toResponseDto(post, currentUserId))
                .collect(Collectors.toList());

        if (currentUserId != null) {
            // Get friend IDs
            java.util.Set<Long> friendIds = friendshipRepository.findAcceptedFriendships(currentUserId).stream()
                    .map(f -> f.getUserId().equals(currentUserId) ? f.getFriendId() : f.getUserId())
                    .collect(Collectors.toSet());

            // Sort
            dtos.sort((a, b) -> {
                boolean aIsFriend = friendIds.contains(a.getOwnerId()) || a.getOwnerId().equals(currentUserId);
                boolean bIsFriend = friendIds.contains(b.getOwnerId()) || b.getOwnerId().equals(currentUserId);

                if (aIsFriend != bIsFriend) {
                    return aIsFriend ? -1 : 1; // Friend posts first
                }

                // Compare by interaction count (descending)
                int aInteractions = a.getLikesCount() + a.getCommentsCount();
                int bInteractions = b.getLikesCount() + b.getCommentsCount();
                if (aInteractions != bInteractions) {
                    return Integer.compare(bInteractions, aInteractions);
                }

                // Compare by ID (descending)
                return Long.compare(b.getId(), a.getId());
            });
        } else {
            // If not logged in, just sort by interactions descending, then ID descending
            dtos.sort((a, b) -> {
                int aInteractions = a.getLikesCount() + a.getCommentsCount();
                int bInteractions = b.getLikesCount() + b.getCommentsCount();
                if (aInteractions != bInteractions) {
                    return Integer.compare(bInteractions, aInteractions);
                }
                return Long.compare(b.getId(), a.getId());
            });
        }

        // Áp dụng phân trang
        int totalElements = dtos.size();
        int totalPages = (int) Math.ceil((double) totalElements / size);
        int fromIndex = Math.min(page * size, totalElements);
        int toIndex = Math.min(fromIndex + size, totalElements);
        List<PostResponseDto> pageContent = dtos.subList(fromIndex, toIndex);

        return PagedResponseDto.<PostResponseDto>builder()
                .content(pageContent)
                .page(page)
                .size(size)
                .totalElements(totalElements)
                .totalPages(totalPages)
                .hasNext(page < totalPages - 1)
                .build();
    }

    // Lấy chi tiết bài viết theo ID
    public PostResponseDto getPostById(Long postId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Bài viết không tồn tại"));
        return toResponseDto(post, null);
    }

    // Cập nhật bài viết (chỉ chủ sở hữu)
    public PostResponseDto updatePost(Long postId, PostUpdateDto dto, User currentUser) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Bài viết không tồn tại"));

        if (!post.getOwnerId().equals(currentUser.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Bạn không có quyền sửa bài viết này");
        }

        // Chỉ cập nhật các trường không null (tương đương exclude_unset)
        if (dto.getTitle() != null) {
            post.setTitle(dto.getTitle());
        }
        if (dto.getContent() != null) {
            post.setContent(dto.getContent());
        }
        if (dto.getImageUrl() != null) {
            post.setImageUrl(dto.getImageUrl());
        }

        post = postRepository.save(post);
        return toResponseDto(post, currentUser.getId());
    }

    // Xóa bài viết (chỉ chủ sở hữu)
    public void deletePost(Long postId, User currentUser) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Bài viết không tồn tại"));

        if (!post.getOwnerId().equals(currentUser.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Bạn không có quyền xóa bài viết này");
        }

        postRepository.delete(post);
    }

    // Lấy Post entity (dùng nội bộ cho like/comment)
    public Post getPostEntity(Long postId) {
        return postRepository.findById(postId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy bài viết"));
    }

    // Resolve optional token to userId
    public Long resolveCurrentUserId(String authHeader) {
        if (authHeader != null && authHeader.toLowerCase().startsWith("bearer ")) {
            String token = authHeader.substring(7);
            try {
                if (jwtTokenProvider.validateToken(token)) {
                    String email = jwtTokenProvider.getEmailFromToken(token);
                    return userRepository.findByEmail(email).map(User::getId).orElse(null);
                }
            } catch (Exception e) {
                // Token không hợp lệ, trả về null
            }
        }
        return null;
    }

    // Lấy danh sách bài viết của một user cụ thể
    public List<PostResponseDto> getPostsByOwnerId(Long ownerId, Long currentUserId) {
        List<Post> posts = postRepository.findByOwnerIdOrderByIdDesc(ownerId);
        return posts.stream()
                .map(post -> toResponseDto(post, currentUserId))
                .collect(Collectors.toList());
    }

    // Chuyển đổi Post entity → PostResponseDto
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
                .build();
    }

    // Lấy danh sách reactions chi tiết
    public List<ReactionResponseDto> getReactions(Long postId) {
        return likeRepository.findAllByPostId(postId).stream()
                .map(like -> {
                    User user = userRepository.findById(like.getUserId()).orElse(null);
                    return ReactionResponseDto.builder()
                            .userId(like.getUserId())
                            .username(user != null ? user.getUsername() : "Unknown")
                            .avatarUrl(user != null ? user.getAvatarUrl() : null)
                            .reactionType(like.getReactionType())
                            .build();
                })
                .collect(Collectors.toList());
    }
}
