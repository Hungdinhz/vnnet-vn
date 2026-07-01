package com.example.backend_java.service;

import com.example.backend_java.dto.CreateGroupRequest;
import com.example.backend_java.dto.GroupDTO;
import com.example.backend_java.dto.PostResponseDto;
import com.example.backend_java.entity.Group;
import com.example.backend_java.entity.GroupMember;
import com.example.backend_java.entity.Post;
import com.example.backend_java.entity.User;
import com.example.backend_java.repository.GroupMemberRepository;
import com.example.backend_java.repository.GroupRepository;
import com.example.backend_java.repository.PostRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class GroupService {

    private final GroupRepository groupRepository;
    private final GroupMemberRepository groupMemberRepository;
    private final PostRepository postRepository;
    private final PostService postService; // For converting Post to PostResponseDto

    public GroupService(GroupRepository groupRepository, GroupMemberRepository groupMemberRepository, 
                        PostRepository postRepository, PostService postService) {
        this.groupRepository = groupRepository;
        this.groupMemberRepository = groupMemberRepository;
        this.postRepository = postRepository;
        this.postService = postService;
    }

    @Transactional
    public GroupDTO createGroup(CreateGroupRequest request, User currentUser) {
        Group group = Group.builder()
                .name(request.getName())
                .description(request.getDescription())
                .coverUrl(request.getCoverUrl() != null ? request.getCoverUrl() : "https://images.unsplash.com/photo-1518605368461-1e1e111d4187?auto=format&fit=crop&q=80&w=1200") // Default cover
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
    public List<GroupDTO> getMyGroups(Long userId) {
        List<GroupMember> memberships = groupMemberRepository.findByUserId(userId);
        return memberships.stream()
                .map(m -> toDto(m.getGroup(), userId))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<GroupDTO> getSuggestedGroups(Long userId) {
        List<Group> suggested = groupRepository.findSuggestedGroups(userId);
        return suggested.stream()
                .map(g -> toDto(g, userId))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public GroupDTO getGroupDetails(Long groupId, Long currentUserId) {
        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Nhóm không tồn tại"));
        return toDto(group, currentUserId);
    }

    @Transactional
    public void joinGroup(Long groupId, User currentUser) {
        if (!groupRepository.existsById(groupId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Nhóm không tồn tại");
        }
        if (groupMemberRepository.existsByGroupIdAndUserId(groupId, currentUser.getId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Bạn đã ở trong nhóm này");
        }
        
        GroupMember member = GroupMember.builder()
                .groupId(groupId)
                .userId(currentUser.getId())
                .role("MEMBER")
                .build();
        groupMemberRepository.save(member);
    }

    @Transactional
    public void leaveGroup(Long groupId, User currentUser) {
        if (!groupMemberRepository.existsByGroupIdAndUserId(groupId, currentUser.getId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Bạn chưa tham gia nhóm này");
        }
        groupMemberRepository.deleteByGroupIdAndUserId(groupId, currentUser.getId());
    }

    @Transactional(readOnly = true)
    public List<PostResponseDto> getGroupPosts(Long groupId, Long currentUserId) {
        if (!groupRepository.existsById(groupId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Nhóm không tồn tại");
        }
        
        // Optional: Check if user is a member to view posts (for private groups)
        // For now, groups are public
        
        List<Post> posts = postRepository.findByGroupIdOrderByIdDesc(groupId);
        return posts.stream()
                .map(p -> postService.toResponseDto(p, currentUserId))
                .collect(Collectors.toList());
    }

    private GroupDTO toDto(Group group, Long currentUserId) {
        List<GroupMember> members = groupMemberRepository.findByGroupId(group.getId());
        boolean isJoined = false;
        String userRole = null;
        
        for (GroupMember m : members) {
            if (m.getUserId().equals(currentUserId)) {
                isJoined = true;
                userRole = m.getRole();
                break;
            }
        }
        
        // Count posts in group
        int postCount = postRepository.findByGroupIdOrderByIdDesc(group.getId()).size();

        return GroupDTO.builder()
                .id(group.getId())
                .name(group.getName())
                .description(group.getDescription())
                .coverUrl(group.getCoverUrl())
                .creatorId(group.getCreatorId())
                .createdAt(group.getCreatedAt())
                .memberCount(members.size())
                .postCount(postCount)
                .isJoined(isJoined)
                .userRole(userRole)
                .build();
    }
}
