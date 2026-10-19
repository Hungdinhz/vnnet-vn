package com.example.backend_java.service;

import com.example.backend_java.dto.post.PostResponseDto;
import com.example.backend_java.dto.social.*;
import com.example.backend_java.entity.Group;
import com.example.backend_java.entity.GroupJoinRequest;
import com.example.backend_java.entity.GroupMember;
import com.example.backend_java.entity.Post;
import com.example.backend_java.entity.User;
import com.example.backend_java.repository.GroupJoinRequestRepository;
import com.example.backend_java.repository.GroupMemberRepository;
import com.example.backend_java.repository.GroupRepository;
import com.example.backend_java.repository.PostRepository;
import com.example.backend_java.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class GroupService {

    private final GroupRepository groupRepository;
    private final GroupMemberRepository groupMemberRepository;
    private final GroupJoinRequestRepository groupJoinRequestRepository;
    private final PostRepository postRepository;
    private final PostService postService;
    private final UserRepository userRepository;

    public GroupService(GroupRepository groupRepository,
                        GroupMemberRepository groupMemberRepository,
                        GroupJoinRequestRepository groupJoinRequestRepository,
                        PostRepository postRepository,
                        PostService postService,
                        UserRepository userRepository) {
        this.groupRepository = groupRepository;
        this.groupMemberRepository = groupMemberRepository;
        this.groupJoinRequestRepository = groupJoinRequestRepository;
        this.postRepository = postRepository;
        this.postService = postService;
        this.userRepository = userRepository;
    }

    private String cleanCoverUrl(String url) {
        if (url == null || url.isBlank()
                || url.contains("photo-1518605368461-1e1e111d4187")
                || url.contains("photo-1522071820081-009f0129c71c")) {
            return null;
        }
        return url.trim();
    }

    private void verifyAdminOrCreator(Long groupId, User currentUser, Group group) {
        if (currentUser.getId().equals(group.getCreatorId())) {
            return;
        }
        GroupMember member = groupMemberRepository.findByGroupIdAndUserId(groupId, currentUser.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "Bạn không có quyền quản lý nhóm này"));
        if (!"ADMIN".equals(member.getRole())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Chỉ Quản trị viên hoặc Trưởng nhóm mới có quyền này");
        }
    }

    @Transactional
    public SocialGroupDto createGroup(CreateSocialGroupDto request, User currentUser) {
        String cover = cleanCoverUrl(request.getCoverUrl());

        Group group = Group.builder()
                .name(request.getName())
                .description(request.getDescription())
                .coverUrl(cover)
                .requiresApproval(request.getRequiresApproval() != null && request.getRequiresApproval())
                .isPrivate(request.getIsPrivate() != null && request.getIsPrivate())
                .creator(currentUser)
                .creatorId(currentUser.getId())
                .build();

        group = groupRepository.save(group);

        // Add creator as ADMIN
        GroupMember adminMember = GroupMember.builder()
                .group(group)
                .groupId(group.getId())
                .user(currentUser)
                .userId(currentUser.getId())
                .role("ADMIN")
                .build();
        groupMemberRepository.save(adminMember);

        return toDto(group, currentUser.getId());
    }

    @Transactional(readOnly = true)
    public List<SocialGroupDto> getMyGroups(Long userId) {
        List<GroupMember> memberships = groupMemberRepository.findByUserId(userId);
        return memberships.stream()
                .map(m -> toDto(m.getGroup(), userId))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<SocialGroupDto> getSuggestedGroups(Long userId) {
        List<Group> suggested = groupRepository.findSuggestedGroups(userId);
        return suggested.stream()
                .map(g -> toDto(g, userId))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public SocialGroupDto getGroupDetails(Long groupId, Long currentUserId) {
        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Nhóm không tồn tại"));
        return toDto(group, currentUserId);
    }

    @Transactional
    public Map<String, Object> joinGroup(Long groupId, User currentUser) {
        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Nhóm không tồn tại"));

        if (groupMemberRepository.existsByGroupIdAndUserId(groupId, currentUser.getId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Bạn đã ở trong nhóm này");
        }

        boolean requiresApproval = Boolean.TRUE.equals(group.getRequiresApproval());
        boolean isCreator = currentUser.getId().equals(group.getCreatorId());

        if (!requiresApproval || isCreator) {
            GroupMember member = GroupMember.builder()
                    .groupId(groupId)
                    .userId(currentUser.getId())
                    .role(isCreator ? "ADMIN" : "MEMBER")
                    .build();
            groupMemberRepository.save(member);
            groupJoinRequestRepository.deleteByGroupIdAndUserId(groupId, currentUser.getId());
            return Map.of("status", "JOINED", "message", "Tham gia nhóm thành công");
        } else {
            Optional<GroupJoinRequest> existingOpt = groupJoinRequestRepository.findByGroupIdAndUserId(groupId, currentUser.getId());
            if (existingOpt.isPresent()) {
                GroupJoinRequest existing = existingOpt.get();
                if ("PENDING".equals(existing.getStatus())) {
                    return Map.of("status", "PENDING", "message", "Bạn đã gửi yêu cầu tham gia, vui lòng chờ phê duyệt");
                }
                existing.setStatus("PENDING");
                groupJoinRequestRepository.save(existing);
            } else {
                GroupJoinRequest req = GroupJoinRequest.builder()
                        .groupId(groupId)
                        .userId(currentUser.getId())
                        .status("PENDING")
                        .build();
                groupJoinRequestRepository.save(req);
            }
            return Map.of("status", "PENDING", "message", "Đã gửi yêu cầu tham gia nhóm, vui lòng chờ trưởng nhóm phê duyệt");
        }
    }

    @Transactional
    public void cancelJoinRequest(Long groupId, User currentUser) {
        groupJoinRequestRepository.deleteByGroupIdAndUserId(groupId, currentUser.getId());
    }

    @Transactional(readOnly = true)
    public List<GroupJoinRequestDto> getJoinRequests(Long groupId, User currentUser) {
        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Nhóm không tồn tại"));

        verifyAdminOrCreator(groupId, currentUser, group);

        List<GroupJoinRequest> requests = groupJoinRequestRepository.findByGroupIdAndStatusOrderByCreatedAtDesc(groupId, "PENDING");
        return requests.stream().map(r -> {
            User u = r.getUser() != null ? r.getUser() : userRepository.findById(r.getUserId()).orElse(null);
            return GroupJoinRequestDto.builder()
                    .id(r.getId())
                    .groupId(groupId)
                    .userId(r.getUserId())
                    .username(u != null ? u.getUsername() : "Thành viên")
                    .avatarUrl(u != null ? u.getAvatarUrl() : null)
                    .bio(u != null ? u.getBio() : null)
                    .status(r.getStatus())
                    .createdAt(r.getCreatedAt())
                    .build();
        }).collect(Collectors.toList());
    }

    @Transactional
    public void approveJoinRequest(Long groupId, Long requestId, User currentUser) {
        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Nhóm không tồn tại"));

        verifyAdminOrCreator(groupId, currentUser, group);

        GroupJoinRequest req = groupJoinRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Yêu cầu không tồn tại"));

        if (!req.getGroupId().equals(groupId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Yêu cầu không thuộc nhóm này");
        }

        if (!groupMemberRepository.existsByGroupIdAndUserId(groupId, req.getUserId())) {
            GroupMember member = GroupMember.builder()
                    .groupId(groupId)
                    .userId(req.getUserId())
                    .role("MEMBER")
                    .build();
            groupMemberRepository.save(member);
        }

        groupJoinRequestRepository.delete(req);
    }

    @Transactional
    public void rejectJoinRequest(Long groupId, Long requestId, User currentUser) {
        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Nhóm không tồn tại"));

        verifyAdminOrCreator(groupId, currentUser, group);

        GroupJoinRequest req = groupJoinRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Yêu cầu không tồn tại"));

        if (!req.getGroupId().equals(groupId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Yêu cầu không thuộc nhóm này");
        }

        groupJoinRequestRepository.delete(req);
    }

    @Transactional
    public void leaveGroup(Long groupId, User currentUser) {
        if (!groupMemberRepository.existsByGroupIdAndUserId(groupId, currentUser.getId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Bạn chưa tham gia nhóm này");
        }
        groupMemberRepository.deleteByGroupIdAndUserId(groupId, currentUser.getId());
        groupJoinRequestRepository.deleteByGroupIdAndUserId(groupId, currentUser.getId());
    }

    @Transactional(readOnly = true)
    public List<PostResponseDto> getGroupPosts(Long groupId, Long currentUserId) {
        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Nhóm không tồn tại"));

        if (Boolean.TRUE.equals(group.getIsPrivate())) {
            boolean isMemberOrCreator = currentUserId != null && (
                    currentUserId.equals(group.getCreatorId()) ||
                    groupMemberRepository.existsByGroupIdAndUserId(groupId, currentUserId)
            );
            if (!isMemberOrCreator) {
                return Collections.emptyList();
            }
        }

        List<Post> posts = postRepository.findByGroupIdOrderByIdDesc(groupId);
        return posts.stream()
                .map(p -> postService.toResponseDto(p, currentUserId))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<SocialGroupMemberDto> getGroupMembers(Long groupId) {
        if (!groupRepository.existsById(groupId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Nhóm không tồn tại");
        }

        List<GroupMember> members = groupMemberRepository.findByGroupId(groupId);
        return members.stream().map(m -> {
            User u = m.getUser() != null ? m.getUser() : userRepository.findById(m.getUserId()).orElse(null);
            return SocialGroupMemberDto.builder()
                    .id(m.getId())
                    .groupId(groupId)
                    .userId(m.getUserId())
                    .username(u != null ? u.getUsername() : "Unknown")
                    .avatarUrl(u != null ? u.getAvatarUrl() : null)
                    .bio(u != null ? u.getBio() : null)
                    .role(m.getRole())
                    .joinedAt(m.getJoinedAt())
                    .build();
        }).collect(Collectors.toList());
    }

    @Transactional
    public void updateMemberRole(Long groupId, Long targetUserId, String newRole, User currentUser) {
        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Nhóm không tồn tại"));

        GroupMember currentMember = groupMemberRepository.findByGroupIdAndUserId(groupId, currentUser.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "Bạn không thuộc nhóm này"));

        if (!"ADMIN".equals(currentMember.getRole()) && !currentUser.getId().equals(group.getCreatorId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Chỉ Quản trị viên mới có quyền đổi vai trò");
        }

        GroupMember targetMember = groupMemberRepository.findByGroupIdAndUserId(groupId, targetUserId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Thành viên không tồn tại trong nhóm"));

        targetMember.setRole(newRole);
        groupMemberRepository.save(targetMember);
    }

    @Transactional
    public void removeMember(Long groupId, Long targetUserId, User currentUser) {
        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Nhóm không tồn tại"));

        // Creator cannot be removed
        if (targetUserId.equals(group.getCreatorId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Không thể xóa Trưởng nhóm");
        }

        GroupMember currentMember = groupMemberRepository.findByGroupIdAndUserId(groupId, currentUser.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "Bạn không thuộc nhóm này"));

        if (!"ADMIN".equals(currentMember.getRole()) && !currentUser.getId().equals(group.getCreatorId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Chỉ Quản trị viên mới có quyền xóa thành viên");
        }

        groupMemberRepository.deleteByGroupIdAndUserId(groupId, targetUserId);
    }

    @Transactional
    public SocialGroupDto updateGroup(Long groupId, UpdateSocialGroupDto request, User currentUser) {
        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Nhóm không tồn tại"));

        verifyAdminOrCreator(groupId, currentUser, group);

        if (request.getName() != null && !request.getName().isBlank()) {
            group.setName(request.getName().trim());
        }
        if (request.getDescription() != null) {
            group.setDescription(request.getDescription().trim());
        }
        if (request.getCoverUrl() != null) {
            group.setCoverUrl(cleanCoverUrl(request.getCoverUrl()));
        }
        if (request.getRequiresApproval() != null) {
            group.setRequiresApproval(request.getRequiresApproval());
        }
        if (request.getIsPrivate() != null) {
            group.setIsPrivate(request.getIsPrivate());
        }

        group = groupRepository.save(group);
        return toDto(group, currentUser.getId());
    }

    @Transactional
    public void deleteGroup(Long groupId, User currentUser) {
        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Nhóm không tồn tại"));

        if (!currentUser.getId().equals(group.getCreatorId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Chỉ Trưởng nhóm mới có quyền xóa nhóm");
        }

        // Delete group members and join requests
        List<GroupMember> members = groupMemberRepository.findByGroupId(groupId);
        groupMemberRepository.deleteAll(members);
        groupJoinRequestRepository.deleteByGroupId(groupId);

        // Disassociate or delete posts
        List<Post> posts = postRepository.findByGroupIdOrderByIdDesc(groupId);
        for (Post p : posts) {
            p.setGroup(null);
            p.setGroupId(null);
            postRepository.save(p);
        }

        groupRepository.delete(group);
    }

    private SocialGroupDto toDto(Group group, Long currentUserId) {
        List<GroupMember> members = groupMemberRepository.findByGroupId(group.getId());
        boolean isJoined = false;
        String userRole = null;

        for (GroupMember m : members) {
            if (currentUserId != null && m.getUserId().equals(currentUserId)) {
                isJoined = true;
                userRole = m.getRole();
                break;
            }
        }

        if (currentUserId != null && currentUserId.equals(group.getCreatorId())) {
            isJoined = true;
            if (userRole == null) {
                userRole = "ADMIN";
            }
        }

        // Count posts in group
        int postCount = postRepository.findByGroupIdOrderByIdDesc(group.getId()).size();

        String coverUrl = cleanCoverUrl(group.getCoverUrl());

        String joinRequestStatus = null;
        if (currentUserId != null && !isJoined) {
            joinRequestStatus = groupJoinRequestRepository.findByGroupIdAndUserId(group.getId(), currentUserId)
                    .map(GroupJoinRequest::getStatus)
                    .orElse(null);
        }

        int pendingRequestCount = 0;
        if (isJoined && ("ADMIN".equals(userRole) || (currentUserId != null && currentUserId.equals(group.getCreatorId())))) {
            pendingRequestCount = groupJoinRequestRepository.countByGroupIdAndStatus(group.getId(), "PENDING");
        }

        return SocialGroupDto.builder()
                .id(group.getId())
                .name(group.getName())
                .description(group.getDescription())
                .coverUrl(coverUrl)
                .creatorId(group.getCreatorId())
                .createdAt(group.getCreatedAt())
                .memberCount(members.size())
                .postCount(postCount)
                .isJoined(isJoined)
                .userRole(userRole)
                .requiresApproval(Boolean.TRUE.equals(group.getRequiresApproval()))
                .isPrivate(Boolean.TRUE.equals(group.getIsPrivate()))
                .joinRequestStatus(joinRequestStatus)
                .pendingRequestCount(pendingRequestCount)
                .build();
    }
}
