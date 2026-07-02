package com.example.backend_java.service;

import com.example.backend_java.dto.PagedResponseDto;
import com.example.backend_java.dto.PostResponseDto;
import com.example.backend_java.dto.SearchResultDto;
import com.example.backend_java.dto.UserResponseDto;
import com.example.backend_java.entity.Post;
import com.example.backend_java.entity.User;
import com.example.backend_java.repository.PostRepository;
import com.example.backend_java.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class SearchService {

    private final UserRepository userRepository;
    private final PostRepository postRepository;
    private final PostService postService;

    public SearchService(UserRepository userRepository, PostRepository postRepository, PostService postService) {
        this.userRepository = userRepository;
        this.postRepository = postRepository;
        this.postService = postService;
    }

    // Tìm kiếm tổng hợp (users + posts)
    public SearchResultDto searchAll(String query, int page, int size, Long currentUserId) {
        Pageable pageable = PageRequest.of(page, size);

        Page<User> usersPage = userRepository.searchByUsernameOrEmail(query, pageable);
        Page<Post> postsPage = postRepository.searchByTitleOrContent(query, pageable);

        List<UserResponseDto> userDtos = usersPage.getContent().stream()
                .map(u -> UserResponseDto.builder()
                        .id(u.getId())
                        .username(u.getUsername())
                        .email(u.getEmail())
                        .avatarUrl(u.getAvatarUrl())
                        .coverUrl(u.getCoverUrl())
                        .bio(u.getBio())
                        .build())
                .collect(Collectors.toList());

        List<PostResponseDto> postDtos = postsPage.getContent().stream()
                .map(p -> postService.toResponseDto(p, currentUserId))
                .collect(Collectors.toList());

        return SearchResultDto.builder()
                .users(userDtos)
                .posts(postDtos)
                .totalUsers(usersPage.getTotalElements())
                .totalPosts(postsPage.getTotalElements())
                .build();
    }

    // Tìm kiếm chỉ users
    public PagedResponseDto<UserResponseDto> searchUsers(String query, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<User> usersPage = userRepository.searchByUsernameOrEmail(query, pageable);

        List<UserResponseDto> userDtos = usersPage.getContent().stream()
                .map(u -> UserResponseDto.builder()
                        .id(u.getId())
                        .username(u.getUsername())
                        .email(u.getEmail())
                        .avatarUrl(u.getAvatarUrl())
                        .coverUrl(u.getCoverUrl())
                        .bio(u.getBio())
                        .build())
                .collect(Collectors.toList());

        return PagedResponseDto.<UserResponseDto>builder()
                .content(userDtos)
                .page(page)
                .size(size)
                .totalElements(usersPage.getTotalElements())
                .totalPages(usersPage.getTotalPages())
                .hasNext(usersPage.hasNext())
                .build();
    }

    // Tìm kiếm chỉ posts
    public PagedResponseDto<PostResponseDto> searchPosts(String query, int page, int size, Long currentUserId) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Post> postsPage = postRepository.searchByTitleOrContent(query, pageable);

        List<PostResponseDto> postDtos = postsPage.getContent().stream()
                .map(p -> postService.toResponseDto(p, currentUserId))
                .collect(Collectors.toList());

        return PagedResponseDto.<PostResponseDto>builder()
                .content(postDtos)
                .page(page)
                .size(size)
                .totalElements(postsPage.getTotalElements())
                .totalPages(postsPage.getTotalPages())
                .hasNext(postsPage.hasNext())
                .build();
    }
}
