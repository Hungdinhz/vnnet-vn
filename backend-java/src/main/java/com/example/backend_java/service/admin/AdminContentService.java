package com.example.backend_java.service.admin;

import com.example.backend_java.dto.admin.AdminModerationDtos.*;
import com.example.backend_java.dto.common.MessageDto;
import com.example.backend_java.entity.Group;
import com.example.backend_java.entity.MarketplaceItem;
import com.example.backend_java.entity.Post;
import com.example.backend_java.entity.User;
import com.example.backend_java.repository.GroupRepository;
import com.example.backend_java.repository.MarketplaceItemRepository;
import com.example.backend_java.repository.PostRepository;
import com.example.backend_java.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AdminContentService {

    private final PostRepository postRepository;
    private final GroupRepository groupRepository;
    private final MarketplaceItemRepository marketplaceRepository;
    private final UserRepository userRepository;
    private final AdminAuditService auditService;

    // --- POSTS ---
    public Page<AdminPostDto> searchPosts(String q, Boolean hidden, int page, int size) {
        return postRepository
                .adminSearchPosts(cleanQuery(q), hidden, PageRequest.of(Math.max(0, page), Math.min(Math.max(1, size), 100)))
                .map(this::toPostDto);
    }

    @Transactional
    public AdminPostDto hidePost(User actor, Long postId, String reason) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy bài viết #" + postId));
        post.setIsHidden(true);
        post.setHiddenReason(reason);
        post.setHiddenAt(LocalDateTime.now());
        post.setHiddenBy(actor.getId());
        postRepository.save(post);
        auditService.record(actor, "POST_HIDDEN", "POST", postId, reason, null);
        return toPostDto(post);
    }

    @Transactional
    public AdminPostDto restorePost(User actor, Long postId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy bài viết #" + postId));
        post.setIsHidden(false);
        post.setHiddenReason(null);
        post.setHiddenAt(null);
        post.setHiddenBy(null);
        postRepository.save(post);
        auditService.record(actor, "POST_RESTORED", "POST", postId, "Khôi phục bài viết", null);
        return toPostDto(post);
    }

    @Transactional
    public MessageDto deletePost(User actor, Long postId, String reason) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy bài viết #" + postId));
        postRepository.delete(post);
        auditService.record(actor, "POST_DELETED", "POST", postId, reason,
                Map.of("owner_id", post.getOwnerId() != null ? post.getOwnerId() : 0L));
        return new MessageDto("Đã xóa vĩnh viễn bài viết #" + postId);
    }

    // --- GROUPS ---
    public Page<AdminGroupDto> searchGroups(String q, Boolean hidden, int page, int size) {
        return groupRepository
                .adminSearchGroups(cleanQuery(q), hidden, PageRequest.of(Math.max(0, page), Math.min(Math.max(1, size), 100)))
                .map(this::toGroupDto);
    }

    @Transactional
    public AdminGroupDto hideGroup(User actor, Long groupId, String reason) {
        Group g = groupRepository.findById(groupId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy nhóm #" + groupId));
        g.setIsHidden(true);
        g.setHiddenReason(reason);
        g.setHiddenAt(LocalDateTime.now());
        g.setHiddenBy(actor.getId());
        groupRepository.save(g);
        auditService.record(actor, "GROUP_HIDDEN", "GROUP", groupId, reason, null);
        return toGroupDto(g);
    }

    @Transactional
    public AdminGroupDto restoreGroup(User actor, Long groupId) {
        Group g = groupRepository.findById(groupId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy nhóm #" + groupId));
        g.setIsHidden(false);
        g.setHiddenReason(null);
        g.setHiddenAt(null);
        g.setHiddenBy(null);
        groupRepository.save(g);
        auditService.record(actor, "GROUP_RESTORED", "GROUP", groupId, "Khôi phục nhóm", null);
        return toGroupDto(g);
    }

    // --- MARKETPLACE ---
    public Page<AdminMarketplaceDto> searchMarketplace(String q, Boolean hidden, int page, int size) {
        return marketplaceRepository
                .adminSearchItems(cleanQuery(q), hidden, PageRequest.of(Math.max(0, page), Math.min(Math.max(1, size), 100)))
                .map(this::toMarketplaceDto);
    }

    @Transactional
    public AdminMarketplaceDto hideMarketplaceItem(User actor, Long itemId, String reason) {
        MarketplaceItem m = marketplaceRepository.findById(itemId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy tin chợ #" + itemId));
        m.setIsHidden(true);
        m.setStatus("hidden");
        m.setHiddenReason(reason);
        m.setHiddenAt(LocalDateTime.now());
        m.setHiddenBy(actor.getId());
        marketplaceRepository.save(m);
        auditService.record(actor, "MARKETPLACE_HIDDEN", "MARKETPLACE_ITEM", itemId, reason, null);
        return toMarketplaceDto(m);
    }

    @Transactional
    public AdminMarketplaceDto restoreMarketplaceItem(User actor, Long itemId) {
        MarketplaceItem m = marketplaceRepository.findById(itemId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy tin chợ #" + itemId));
        m.setIsHidden(false);
        if ("hidden".equalsIgnoreCase(m.getStatus())) {
            m.setStatus("active");
        }
        m.setHiddenReason(null);
        m.setHiddenAt(null);
        m.setHiddenBy(null);
        marketplaceRepository.save(m);
        auditService.record(actor, "MARKETPLACE_RESTORED", "MARKETPLACE_ITEM", itemId, "Khôi phục tin chợ", null);
        return toMarketplaceDto(m);
    }

    private String cleanQuery(String q) {
        return (q != null && !q.isBlank()) ? q.trim() : null;
    }

    private AdminPostDto toPostDto(Post p) {
        String ownerUsername = p.getOwnerId() != null
                ? userRepository.findById(p.getOwnerId()).map(User::getUsername).orElse("unknown")
                : "unknown";
        return AdminPostDto.builder()
                .id(p.getId())
                .title(p.getTitle())
                .content(p.getContent())
                .imageUrl(p.getImageUrl())
                .visibility(p.getVisibility())
                .ownerId(p.getOwnerId())
                .ownerUsername(ownerUsername)
                .groupId(p.getGroupId())
                .isHidden(Boolean.TRUE.equals(p.getIsHidden()))
                .hiddenReason(p.getHiddenReason())
                .hiddenAt(p.getHiddenAt())
                .createdAt(p.getCreatedAt())
                .build();
    }

    private AdminGroupDto toGroupDto(Group g) {
        return AdminGroupDto.builder()
                .id(g.getId())
                .name(g.getName())
                .description(g.getDescription())
                .creatorId(g.getCreatorId())
                .isPrivate(Boolean.TRUE.equals(g.getIsPrivate()))
                .isHidden(Boolean.TRUE.equals(g.getIsHidden()))
                .hiddenReason(g.getHiddenReason())
                .createdAt(g.getCreatedAt())
                .build();
    }

    private AdminMarketplaceDto toMarketplaceDto(MarketplaceItem m) {
        return AdminMarketplaceDto.builder()
                .id(m.getId())
                .title(m.getTitle())
                .description(m.getDescription())
                .price(m.getPrice())
                .category(m.getCategory())
                .status(m.getStatus())
                .sellerId(m.getSellerId())
                .isHidden(Boolean.TRUE.equals(m.getIsHidden()))
                .hiddenReason(m.getHiddenReason())
                .createdAt(m.getCreatedAt())
                .build();
    }
}
