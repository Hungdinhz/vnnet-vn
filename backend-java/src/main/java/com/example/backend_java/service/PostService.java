package com.example.backend_java.service;

import com.example.backend_java.dto.common.PagedResponseDto;
import com.example.backend_java.dto.post.*;
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
    private final com.example.backend_java.mapper.PostMapper postMapper;
    private final UserBlockRepository userBlockRepository;

    public PostService(PostRepository postRepository, LikeRepository likeRepository,
                       CommentRepository commentRepository, UserRepository userRepository,
                       JwtTokenProvider jwtTokenProvider, FriendshipRepository friendshipRepository,
                       GroupRepository groupRepository, GroupMemberRepository groupMemberRepository,
                       PostMentionRepository postMentionRepository, NotificationService notificationService,
                       com.example.backend_java.mapper.PostMapper postMapper,
                       UserBlockRepository userBlockRepository) {
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
        this.postMapper = postMapper;
        this.userBlockRepository = userBlockRepository;
    }

    // Kiểm tra quyền xem bài viết tập trung (chặn, nhóm kín, tài khoản riêng tư, visibility)
    public boolean canViewPost(Post post, Long currentUserId) {
        if (post == null) return false;

        if (currentUserId != null && userBlockRepository.isBlockedEither(post.getOwnerId(), currentUserId)) {
            return false;
        }

        boolean isOwner = currentUserId != null && currentUserId.equals(post.getOwnerId());
        if (isOwner) return true;

        // Nếu bài viết thuộc nhóm kín -> bắt buộc là thành viên nhóm
        if (post.getGroupId() != null) {
            com.example.backend_java.entity.Group grp = post.getGroup() != null
                    ? post.getGroup()
                    : groupRepository.findById(post.getGroupId()).orElse(null);
            if (grp != null && Boolean.TRUE.equals(grp.getIsPrivate())) {
                if (currentUserId == null) return false;
                boolean isMember = groupMemberRepository.existsByGroupIdAndUserId(grp.getId(), currentUserId)
                        || currentUserId.equals(grp.getCreatorId());
                if (!isMember) return false;
            }
        }

        // Kiểm tra cài đặt riêng tư của chủ bài viết
        User owner = post.getOwner() != null ? post.getOwner() : userRepository.findById(post.getOwnerId()).orElse(null);
        boolean isFriend = false;
        if (currentUserId != null) {
            isFriend = friendshipRepository.findExistingFriendship(post.getOwnerId(), currentUserId)
                    .map(f -> "accepted".equalsIgnoreCase(f.getStatus()))
                    .orElse(false);
        }

        if (owner != null && Boolean.TRUE.equals(owner.getIsPrivate()) && !isFriend) {
            return false;
        }

        String vis = post.getVisibility();
        if (vis == null || "public".equalsIgnoreCase(vis)) {
            return true;
        }
        if ("friends".equalsIgnoreCase(vis)) {
            return isFriend;
        }
        // "private" chỉ chủ bài viết xem được (đã return true ở trên)
        return false;
    }

    public void assertCanViewPost(Post post, Long currentUserId) {
        if (!canViewPost(post, currentUserId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Bài viết không tồn tại");
        }
    }

    // Tạo bài viết mới (tương đương crud_post.create_post)
    public PostResponseDto createPost(PostCreateDto dto, User currentUser) {
        com.example.backend_java.util.UrlValidationUtil.validateHttpUrlOrNull(dto.getImageUrl(), "imageUrl");

        Post sharedPost = null;
        if (dto.getSharedPostId() != null) {
            sharedPost = postRepository.findById(dto.getSharedPostId())
                    .orElseThrow(() -> new ResponseStatusException(org.springframework.http.HttpStatus.NOT_FOUND, "Không tìm thấy bài viết để chia sẻ"));
            assertCanViewPost(sharedPost, currentUser.getId());
        }

        com.example.backend_java.entity.Group group = null;
        if (dto.getGroupId() != null) {
            group = groupRepository.findById(dto.getGroupId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Nhóm không tồn tại"));
            boolean isMember = groupMemberRepository.existsByGroupIdAndUserId(group.getId(), currentUser.getId())
                    || currentUser.getId().equals(group.getCreatorId());
            if (!isMember) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Bạn phải là thành viên nhóm để đăng bài trong nhóm này");
            }
        }

        String visibility = dto.getVisibility();
        if (visibility == null || visibility.isBlank()) {
            visibility = "public";
        }

        Post post = Post.builder()
                .title(dto.getTitle())
                .content(dto.getContent())
                .imageUrl(dto.getImageUrl())
                .visibility(visibility)
                .owner(currentUser)
                .sharedPostId(dto.getSharedPostId())
                .sharedPost(sharedPost)
                .group(group)
                .build();

        post = postRepository.save(post);

        // Lưu mentions (tối đa 20 người, khử trùng lặp và không tag người đã chặn)
        if (dto.getMentionedUserIds() != null && !dto.getMentionedUserIds().isEmpty()) {
            java.util.Set<Long> uniqueMentionIds = new java.util.LinkedHashSet<>(dto.getMentionedUserIds());
            int count = 0;
            for (Long mentionedUserId : uniqueMentionIds) {
                if (count >= 20) break;
                if (mentionedUserId != null && !mentionedUserId.equals(currentUser.getId())
                        && !userBlockRepository.isBlockedEither(currentUser.getId(), mentionedUserId)
                        && userRepository.existsById(mentionedUserId)) {
                    PostMention mention = PostMention.builder()
                            .post(post)
                            .mentionedUserId(mentionedUserId)
                            .build();
                    postMentionRepository.save(mention);
                    notificationService.createNotification(
                            mentionedUserId, currentUser.getId(), "mention", post.getId());
                    count++;
                }
            }
        }

        return toResponseDto(post, currentUser.getId());
    }

    // Lấy danh sách bài viết (tương đương crud_post.get_posts)
    // currentUserId có thể null nếu chưa đăng nhập
    public PagedResponseDto<PostResponseDto> getPosts(int page, int size, Long currentUserId) {
        int safePage = Math.max(page, 0);
        int safeSize = Math.min(Math.max(size, 1), 50);
        List<Post> posts = postRepository.findAllByOrderByIdDesc();

        java.util.Set<Long> joinedGroupIds = new java.util.HashSet<>();
        java.util.Set<Long> friendIds = new java.util.HashSet<>();
        java.util.Set<Long> blockedIds = new java.util.HashSet<>();
        if (currentUserId != null) {
            joinedGroupIds = groupMemberRepository.findByUserId(currentUserId).stream()
                    .map(com.example.backend_java.entity.GroupMember::getGroupId)
                    .collect(Collectors.toSet());
            friendIds = friendshipRepository.findAcceptedFriendships(currentUserId).stream()
                    .map(f -> f.getUserId().equals(currentUserId) ? f.getFriendId() : f.getUserId())
                    .collect(Collectors.toSet());
            blockedIds = userBlockRepository.findAllBlockedRelatedUserIds(currentUserId);
        }

        final java.util.Set<Long> finalJoinedGroupIds = joinedGroupIds;
        final java.util.Set<Long> finalFriendIds = friendIds;
        final java.util.Set<Long> finalBlockedIds = blockedIds;
        List<PostResponseDto> dtos = posts.stream()
                .filter(post -> !finalBlockedIds.contains(post.getOwnerId()))
                .filter(post -> post.getGroupId() == null || finalJoinedGroupIds.contains(post.getGroupId()))
                .filter(post -> {
                    String vis = post.getVisibility();
                    if (vis == null || "public".equalsIgnoreCase(vis)) {
                        return true;
                    }
                    if (currentUserId == null) {
                        return false;
                    }
                    if (currentUserId.equals(post.getOwnerId())) {
                        return true;
                    }
                    if ("friends".equalsIgnoreCase(vis)) {
                        return finalFriendIds.contains(post.getOwnerId());
                    }
                    return false;
                })
                .map(post -> toResponseDto(post, currentUserId))
                .collect(Collectors.toList());

        if (currentUserId != null) {

            // Sort
            dtos.sort((a, b) -> {
                boolean aIsFriend = finalFriendIds.contains(a.getOwnerId()) || a.getOwnerId().equals(currentUserId);
                boolean bIsFriend = finalFriendIds.contains(b.getOwnerId()) || b.getOwnerId().equals(currentUserId);

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

        // Áp dụng phân trang an toàn
        int totalElements = dtos.size();
        int totalPages = (int) Math.ceil((double) totalElements / safeSize);
        int fromIndex = Math.min(safePage * safeSize, totalElements);
        int toIndex = Math.min(fromIndex + safeSize, totalElements);
        List<PostResponseDto> pageContent = dtos.subList(fromIndex, toIndex);

        return PagedResponseDto.<PostResponseDto>builder()
                .content(pageContent)
                .page(safePage)
                .size(safeSize)
                .totalElements(totalElements)
                .totalPages(totalPages)
                .hasNext(safePage < totalPages - 1)
                .build();
    }

    // Lấy chi tiết bài viết theo ID
    public PostResponseDto getPostById(Long postId) {
        return getPostById(postId, null);
    }

    public PostResponseDto getPostById(Long postId, Long currentUserId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Bài viết không tồn tại"));

        assertCanViewPost(post, currentUserId);
        return toResponseDto(post, currentUserId);
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
            com.example.backend_java.util.UrlValidationUtil.validateHttpUrlOrNull(dto.getImageUrl(), "imageUrl");
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
        if (currentUserId != null && userBlockRepository.isBlockedEither(ownerId, currentUserId)) {
            return Collections.emptyList();
        }

        User owner = userRepository.findById(ownerId).orElse(null);
        if (owner != null && Boolean.TRUE.equals(owner.getIsPrivate())) {
            boolean isOwner = currentUserId != null && currentUserId.equals(ownerId);
            if (!isOwner) {
                boolean isFriend = false;
                if (currentUserId != null) {
                    isFriend = friendshipRepository.findExistingFriendship(ownerId, currentUserId)
                            .map(f -> "accepted".equalsIgnoreCase(f.getStatus()))
                            .orElse(false);
                }
                if (!isFriend) {
                    return Collections.emptyList();
                }
            }
        }

        List<Post> posts = postRepository.findByOwnerIdOrderByIdDesc(ownerId);
        return posts.stream()
                .filter(post -> canViewPost(post, currentUserId))
                .map(post -> toResponseDto(post, currentUserId))
                .collect(Collectors.toList());
    }

    // Chuyển đổi Post entity → PostResponseDto
    public PostResponseDto toResponseDto(Post post, Long currentUserId) {
        return postMapper.toResponseDto(post, currentUserId);
    }

    // Lấy danh sách reactions chi tiết (kiểm tra quyền xem bài viết)
    public List<ReactionResponseDto> getReactions(Long postId, Long currentUserId) {
        Post post = getPostEntity(postId);
        assertCanViewPost(post, currentUserId);
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

    // Trích xuất top 10 hashtag xu hướng từ nội dung bài viết
    public List<TrendingHashtagDto> getTrendingHashtags() {
        List<Post> posts = postRepository.findAll();
        Map<String, Long> tagCounts = new HashMap<>();
        java.util.regex.Pattern hashtagPattern = java.util.regex.Pattern.compile("#([\\p{L}\\p{N}_]+)");

        for (Post post : posts) {
            String text = (post.getTitle() != null ? post.getTitle() + " " : "") + 
                          (post.getContent() != null ? post.getContent() : "");
            java.util.regex.Matcher matcher = hashtagPattern.matcher(text);
            Set<String> seenInPost = new HashSet<>();
            while (matcher.find()) {
                String tag = matcher.group(0);
                if (seenInPost.add(tag.toLowerCase())) {
                    tagCounts.put(tag, tagCounts.getOrDefault(tag, 0L) + 1);
                }
            }
        }

        return tagCounts.entrySet().stream()
                .sorted((e1, e2) -> Long.compare(e2.getValue(), e1.getValue()))
                .limit(10)
                .map(e -> TrendingHashtagDto.builder()
                        .tag(e.getKey())
                        .count(e.getValue())
                        .build())
                .collect(Collectors.toList());
    }
}
