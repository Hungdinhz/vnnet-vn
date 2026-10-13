package com.example.backend_java.controller;
import com.example.backend_java.dto.social.SocialGroupMemberDto;
import com.example.backend_java.dto.social.UpdateGroupRoleRequest;
import com.example.backend_java.dto.social.UpdateSocialGroupDto;

import com.example.backend_java.dto.social.CreateSocialGroupDto;
import com.example.backend_java.dto.social.SocialGroupDto;
import com.example.backend_java.dto.post.PostResponseDto;
import com.example.backend_java.entity.User;
import com.example.backend_java.repository.UserRepository;
import com.example.backend_java.security.JwtTokenProvider;
import com.example.backend_java.service.GroupService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/groups")
public class GroupController {

    private final GroupService groupService;
    private final JwtTokenProvider jwtTokenProvider;
    private final UserRepository userRepository;

    public GroupController(GroupService groupService, JwtTokenProvider jwtTokenProvider, UserRepository userRepository) {
        this.groupService = groupService;
        this.jwtTokenProvider = jwtTokenProvider;
        this.userRepository = userRepository;
    }

    private User getCurrentUser(String token) {
        if (token != null && token.toLowerCase().startsWith("bearer ")) {
            String jwt = token.substring(7).trim();
            try {
                if (jwtTokenProvider.validateToken(jwt)) {
                    String email = jwtTokenProvider.getEmailFromToken(jwt);
                    return userRepository.findByEmail(email)
                            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Người dùng không tồn tại"));
                }
            } catch (Exception e) {}
        }
        try {
            org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.isAuthenticated()) {
                if (auth.getPrincipal() instanceof User) {
                    return (User) auth.getPrincipal();
                } else if (!"anonymousUser".equals(auth.getPrincipal())) {
                    String email = auth.getName();
                    User u = userRepository.findByEmail(email).orElse(null);
                    if (u != null) return u;
                }
            }
        } catch (Exception e) {}
        throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Bạn chưa đăng nhập");
    }

    private Long getCurrentUserIdSilently(String token) {
        if (token != null && token.toLowerCase().startsWith("bearer ")) {
            String jwt = token.substring(7).trim();
            try {
                if (jwtTokenProvider.validateToken(jwt)) {
                    String email = jwtTokenProvider.getEmailFromToken(jwt);
                    return userRepository.findByEmail(email).map(User::getId).orElse(null);
                }
            } catch (Exception e) {}
        }
        try {
            org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.isAuthenticated()) {
                if (auth.getPrincipal() instanceof User) {
                    return ((User) auth.getPrincipal()).getId();
                } else if (!"anonymousUser".equals(auth.getPrincipal())) {
                    String email = auth.getName();
                    return userRepository.findByEmail(email).map(User::getId).orElse(null);
                }
            }
        } catch (Exception e) {}
        return null;
    }

    @PostMapping
    public ResponseEntity<SocialGroupDto> createGroup(@RequestBody CreateSocialGroupDto request,
                                                @RequestHeader(value = "Authorization", required = false) String token) {
        User user = getCurrentUser(token);
        SocialGroupDto group = groupService.createGroup(request, user);
        return ResponseEntity.ok(group);
    }

    @GetMapping("/me")
    public ResponseEntity<List<SocialGroupDto>> getMyGroups(@RequestHeader(value = "Authorization", required = false) String token) {
        User user = getCurrentUser(token);
        return ResponseEntity.ok(groupService.getMyGroups(user.getId()));
    }

    @GetMapping
    public ResponseEntity<List<SocialGroupDto>> getSuggestedGroups(@RequestHeader(value = "Authorization", required = false) String token) {
        Long userId = getCurrentUserIdSilently(token);
        // If not logged in, just pass null or default. For simplicity, we just return empty or all groups if null.
        if (userId == null) {
            return ResponseEntity.ok(List.of()); // Or a generic list
        }
        return ResponseEntity.ok(groupService.getSuggestedGroups(userId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<SocialGroupDto> getGroupDetails(@PathVariable Long id,
                                                    @RequestHeader(value = "Authorization", required = false) String token) {
        Long userId = getCurrentUserIdSilently(token);
        return ResponseEntity.ok(groupService.getGroupDetails(id, userId));
    }

    @PostMapping("/{id}/join")
    public ResponseEntity<?> joinGroup(@PathVariable Long id,
                                       @RequestHeader(value = "Authorization", required = false) String token) {
        User user = getCurrentUser(token);
        groupService.joinGroup(id, user);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}/leave")
    public ResponseEntity<?> leaveGroup(@PathVariable Long id,
                                        @RequestHeader(value = "Authorization", required = false) String token) {
        User user = getCurrentUser(token);
        groupService.leaveGroup(id, user);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{id}/posts")
    public ResponseEntity<List<PostResponseDto>> getGroupPosts(@PathVariable Long id,
                                                               @RequestHeader(value = "Authorization", required = false) String token) {
        Long userId = getCurrentUserIdSilently(token);
        return ResponseEntity.ok(groupService.getGroupPosts(id, userId));
    }

    @GetMapping("/{id}/members")
    public ResponseEntity<List<com.example.backend_java.dto.social.SocialGroupMemberDto>> getGroupMembers(@PathVariable Long id) {
        return ResponseEntity.ok(groupService.getGroupMembers(id));
    }

    @PutMapping("/{id}/members/{userId}/role")
    public ResponseEntity<?> updateMemberRole(@PathVariable Long id,
                                              @PathVariable Long userId,
                                              @RequestBody com.example.backend_java.dto.social.UpdateGroupRoleRequest request,
                                              @RequestHeader(value = "Authorization", required = false) String token) {
        User user = getCurrentUser(token);
        groupService.updateMemberRole(id, userId, request.getRole(), user);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}/members/{userId}")
    public ResponseEntity<?> removeMember(@PathVariable Long id,
                                          @PathVariable Long userId,
                                          @RequestHeader(value = "Authorization", required = false) String token) {
        User user = getCurrentUser(token);
        groupService.removeMember(id, userId, user);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{id}")
    public ResponseEntity<SocialGroupDto> updateGroup(@PathVariable Long id,
                                                @RequestBody com.example.backend_java.dto.social.UpdateSocialGroupDto request,
                                                @RequestHeader(value = "Authorization", required = false) String token) {
        User user = getCurrentUser(token);
        return ResponseEntity.ok(groupService.updateGroup(id, request, user));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteGroup(@PathVariable Long id,
                                         @RequestHeader(value = "Authorization", required = false) String token) {
        User user = getCurrentUser(token);
        groupService.deleteGroup(id, user);
        return ResponseEntity.ok().build();
    }
}
