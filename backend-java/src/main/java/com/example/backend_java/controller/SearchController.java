package com.example.backend_java.controller;

import com.example.backend_java.dto.PagedResponseDto;
import com.example.backend_java.dto.PostResponseDto;
import com.example.backend_java.dto.SearchResultDto;
import com.example.backend_java.dto.UserResponseDto;
import com.example.backend_java.service.PostService;
import com.example.backend_java.service.SearchService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/search")
public class SearchController {

    private final SearchService searchService;
    private final PostService postService;

    public SearchController(SearchService searchService, PostService postService) {
        this.searchService = searchService;
        this.postService = postService;
    }

    // GET /search?q=keyword&type=all|users|posts&page=0&size=10
    @GetMapping("")
    public ResponseEntity<?> search(
            @RequestParam("q") String query,
            @RequestParam(defaultValue = "all") String type,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {

        Long currentUserId = postService.resolveCurrentUserId(authHeader);

        switch (type.toLowerCase()) {
            case "users":
                PagedResponseDto<UserResponseDto> usersResult = searchService.searchUsers(query, page, size);
                return ResponseEntity.ok(usersResult);
            case "posts":
                PagedResponseDto<PostResponseDto> postsResult = searchService.searchPosts(query, page, size, currentUserId);
                return ResponseEntity.ok(postsResult);
            default: // "all"
                SearchResultDto allResult = searchService.searchAll(query, page, size, currentUserId);
                return ResponseEntity.ok(allResult);
        }
    }
}
