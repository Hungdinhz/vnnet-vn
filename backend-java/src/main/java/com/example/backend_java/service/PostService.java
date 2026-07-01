package com.example.backend_java.service;

import com.example.backend_java.dto.PostCreateDto;
import com.example.backend_java.dto.PostResponseDto;
import com.example.backend_java.dto.PostUpdateDto;
import com.example.backend_java.entity.Post;
import com.example.backend_java.entity.User;
import com.example.backend_java.repository.CommentRepository;
import com.example.backend_java.repository.GroupRepository;
import com.example.backend_java.repository.LikeRepository;
import com.example.backend_java.repository.PostRepository;
import com.example.backend_java.repository.UserRepository;
import com.example.backend_java.security.JwtTokenProvider;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.stream.Collectors;

import com.example.backend_java.repository.FriendshipRepository;

@Service
public class PostService {

    private final PostRepository postRepository;
    private final LikeRepository likeRepository;
    private final CommentRepository commentRepository;
    private final UserRepository userRepository;
    private final JwtTokenProvider jwtTokenProvider;
    private final FriendshipRepository friendshipRepository;
    private final GroupRepository groupRepository;

    public PostService(PostRepository postRepository, LikeRepository likeRepository,
                       CommentRepository commentRepository, UserRepository userRepository,
                       JwtTokenProvider jwtTokenProvider, FriendshipRepository friendshipRepository,
                       GroupRepository groupRepository) {
        this.postRepository = postRepository;
        this.likeRepository = likeRepository;
        this.commentRepository = commentRepository;
        this.userRepository = userRepository;
        this.jwtTokenProvider = jwtTokenProvider;
        this.friendshipRepository = friendshipRepository;
        this.groupRepository = groupRepository;
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
        return toResponseDto(post, currentUser.getId());
    }

    // Lấy danh sách bài viết (tương đương crud_post.get_posts)
    // currentUserId có thể null nếu chưa đăng nhập
    public List<PostResponseDto> getPosts(int skip, int limit, Long currentUserId) {
        List<Post> posts = postRepository.findAllByOrderByIdDesc();

        // Convert all to DTOs first so we can sort them using DTO metadata (likesCount, commentsCount)
        List<PostResponseDto> dtos = posts.stream()
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

        // Áp dụng phân trang thủ công (skip + limit)
        int fromIndex = Math.min(skip, dtos.size());
        int toIndex = Math.min(skip + limit, dtos.size());
        return dtos.subList(fromIndex, toIndex);
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
                .sharedPost(sharedPostDto)
                .groupId(post.getGroup() != null ? post.getGroup().getId() : null)
                .groupName(post.getGroup() != null ? post.getGroup().getName() : null)
                .build();
    }
}
