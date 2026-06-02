package com.example.backend_java.service;

import com.example.backend_java.dto.PostCreateDto;
import com.example.backend_java.dto.PostResponseDto;
import com.example.backend_java.dto.PostUpdateDto;
import com.example.backend_java.entity.Post;
import com.example.backend_java.entity.User;
import com.example.backend_java.repository.CommentRepository;
import com.example.backend_java.repository.LikeRepository;
import com.example.backend_java.repository.PostRepository;
import com.example.backend_java.repository.UserRepository;
import com.example.backend_java.security.JwtTokenProvider;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class PostService {

    private final PostRepository postRepository;
    private final LikeRepository likeRepository;
    private final CommentRepository commentRepository;
    private final UserRepository userRepository;
    private final JwtTokenProvider jwtTokenProvider;

    public PostService(PostRepository postRepository, LikeRepository likeRepository,
                       CommentRepository commentRepository, UserRepository userRepository,
                       JwtTokenProvider jwtTokenProvider) {
        this.postRepository = postRepository;
        this.likeRepository = likeRepository;
        this.commentRepository = commentRepository;
        this.userRepository = userRepository;
        this.jwtTokenProvider = jwtTokenProvider;
    }

    // Tạo bài viết mới (tương đương crud_post.create_post)
    public PostResponseDto createPost(PostCreateDto dto, User currentUser) {
        Post post = Post.builder()
                .title(dto.getTitle())
                .content(dto.getContent())
                .imageUrl(dto.getImageUrl())
                .owner(currentUser)
                .build();

        post = postRepository.save(post);
        return toResponseDto(post, currentUser.getId());
    }

    // Lấy danh sách bài viết (tương đương crud_post.get_posts)
    // currentUserId có thể null nếu chưa đăng nhập
    public List<PostResponseDto> getPosts(int skip, int limit, Long currentUserId) {
        List<Post> posts = postRepository.findAllByOrderByIdDesc();

        // Áp dụng phân trang thủ công (skip + limit)
        int fromIndex = Math.min(skip, posts.size());
        int toIndex = Math.min(skip + limit, posts.size());
        posts = posts.subList(fromIndex, toIndex);

        return posts.stream()
                .map(post -> toResponseDto(post, currentUserId))
                .collect(Collectors.toList());
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
    private PostResponseDto toResponseDto(Post post, Long currentUserId) {
        long likesCount = likeRepository.countByPostId(post.getId());
        long commentsCount = commentRepository.countByPostId(post.getId());
        boolean isLiked = currentUserId != null && likeRepository.existsByUserIdAndPostId(currentUserId, post.getId());

        User owner = post.getOwner();

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
                .build();
    }
}
