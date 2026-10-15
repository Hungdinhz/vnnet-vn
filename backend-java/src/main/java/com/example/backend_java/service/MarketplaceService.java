package com.example.backend_java.service;

import com.example.backend_java.dto.common.PagedResponseDto;
import com.example.backend_java.dto.marketplace.*;
import com.example.backend_java.entity.MarketplaceItem;
import com.example.backend_java.entity.SellerReview;
import com.example.backend_java.entity.User;
import com.example.backend_java.mapper.MarketplaceMapper;
import com.example.backend_java.repository.MarketplaceItemRepository;
import com.example.backend_java.repository.SellerReviewRepository;
import com.example.backend_java.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MarketplaceService {

    private final MarketplaceItemRepository marketplaceItemRepository;
    private final SellerReviewRepository sellerReviewRepository;
    private final UserRepository userRepository;
    private final MarketplaceMapper marketplaceMapper;
    private final NotificationService notificationService;

    // 1. Tạo tin đăng bán mới
    @Transactional
    public MarketplaceItemResponseDto createItem(MarketplaceItemCreateDto dto, User currentUser) {
        String imagesStr = (dto.getImageUrls() != null && !dto.getImageUrls().isEmpty())
                ? String.join("|||", dto.getImageUrls())
                : null;

        String condition = dto.getCondition();
        if (condition == null || condition.isBlank()) {
            condition = "used";
        }

        MarketplaceItem item = MarketplaceItem.builder()
                .title(dto.getTitle())
                .description(dto.getDescription())
                .price(dto.getPrice())
                .category(dto.getCategory())
                .condition(condition)
                .location(dto.getLocation() != null ? dto.getLocation() : currentUser.getLocation())
                .imageUrls(imagesStr)
                .status("active")
                .seller(currentUser)
                .viewsCount(0)
                .build();

        MarketplaceItem saved = marketplaceItemRepository.save(item);
        return marketplaceMapper.toResponseDto(saved);
    }

    // 2. Lấy danh sách sản phẩm với phân trang, tìm kiếm & bộ lọc
    @Transactional(readOnly = true)
    public PagedResponseDto<MarketplaceItemResponseDto> getItems(
            int page,
            int size,
            String category,
            BigDecimal minPrice,
            BigDecimal maxPrice,
            String query) {

        Pageable pageable = PageRequest.of(Math.max(0, page), Math.max(1, size));
        Page<MarketplaceItem> itemPage = marketplaceItemRepository.searchAndFilterItems(
                "active",
                category,
                minPrice,
                maxPrice,
                query,
                pageable
        );

        List<MarketplaceItemResponseDto> content = itemPage.getContent().stream()
                .map(marketplaceMapper::toResponseDto)
                .collect(Collectors.toList());

        return PagedResponseDto.<MarketplaceItemResponseDto>builder()
                .content(content)
                .page(itemPage.getNumber())
                .size(itemPage.getSize())
                .totalElements((int) itemPage.getTotalElements())
                .totalPages(itemPage.getTotalPages())
                .hasNext(itemPage.hasNext())
                .build();
    }

    // 3. Chi tiết sản phẩm (tăng lượt xem)
    @Transactional
    public MarketplaceItemResponseDto getItemById(Long id) {
        MarketplaceItem item = marketplaceItemRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Sản phẩm không tồn tại"));

        item.setViewsCount(item.getViewsCount() != null ? item.getViewsCount() + 1 : 1);
        marketplaceItemRepository.save(item);

        return marketplaceMapper.toResponseDto(item);
    }

    // 4. Lấy danh sách sản phẩm của người dùng hiện tại
    @Transactional(readOnly = true)
    public List<MarketplaceItemResponseDto> getMyItems(User currentUser) {
        return marketplaceItemRepository.findBySellerIdOrderByIdDesc(currentUser.getId()).stream()
                .map(marketplaceMapper::toResponseDto)
                .collect(Collectors.toList());
    }

    // 5. Lấy danh sách sản phẩm của một người bán bất kỳ
    @Transactional(readOnly = true)
    public List<MarketplaceItemResponseDto> getItemsBySeller(Long sellerId) {
        return marketplaceItemRepository.findBySellerIdOrderByIdDesc(sellerId).stream()
                .map(marketplaceMapper::toResponseDto)
                .collect(Collectors.toList());
    }

    // 6. Cập nhật tin đăng bán (chỉ người bán)
    @Transactional
    public MarketplaceItemResponseDto updateItem(Long id, MarketplaceItemUpdateDto dto, User currentUser) {
        MarketplaceItem item = marketplaceItemRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Sản phẩm không tồn tại"));

        if (!item.getSellerId().equals(currentUser.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Bạn không có quyền chỉnh sửa sản phẩm này");
        }

        if (dto.getTitle() != null && !dto.getTitle().isBlank()) {
            item.setTitle(dto.getTitle());
        }
        if (dto.getDescription() != null && !dto.getDescription().isBlank()) {
            item.setDescription(dto.getDescription());
        }
        if (dto.getPrice() != null) {
            item.setPrice(dto.getPrice());
        }
        if (dto.getCategory() != null && !dto.getCategory().isBlank()) {
            item.setCategory(dto.getCategory());
        }
        if (dto.getCondition() != null && !dto.getCondition().isBlank()) {
            item.setCondition(dto.getCondition());
        }
        if (dto.getLocation() != null) {
            item.setLocation(dto.getLocation());
        }
        if (dto.getImageUrls() != null) {
            item.setImageUrls(String.join("|||", dto.getImageUrls()));
        }
        if (dto.getStatus() != null && !dto.getStatus().isBlank()) {
            item.setStatus(dto.getStatus());
        }

        MarketplaceItem updated = marketplaceItemRepository.save(item);
        return marketplaceMapper.toResponseDto(updated);
    }

    // 7. Xóa tin đăng bán (chỉ người bán)
    @Transactional
    public void deleteItem(Long id, User currentUser) {
        MarketplaceItem item = marketplaceItemRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Sản phẩm không tồn tại"));

        if (!item.getSellerId().equals(currentUser.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Bạn không có quyền xóa sản phẩm này");
        }

        marketplaceItemRepository.delete(item);
    }

    // 8. Đánh dấu đã bán (có thể gán người mua cụ thể)
    @Transactional
    public MarketplaceItemResponseDto markAsSold(Long id, MarkSoldRequestDto dto, User currentUser) {
        MarketplaceItem item = marketplaceItemRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Sản phẩm không tồn tại"));

        if (!item.getSellerId().equals(currentUser.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Bạn không có quyền cập nhật trạng thái sản phẩm này");
        }

        item.setStatus("sold");

        if (dto != null) {
            User buyer = null;
            if (dto.getBuyerId() != null) {
                buyer = userRepository.findById(dto.getBuyerId()).orElse(null);
            } else if (dto.getBuyerUsername() != null && !dto.getBuyerUsername().isBlank()) {
                buyer = userRepository.findByUsername(dto.getBuyerUsername()).orElse(null);
            }

            if (buyer != null) {
                item.setBuyer(buyer);
                // Gửi thông báo cho người mua để họ có thể vào đánh giá người bán
                notificationService.createNotification(buyer.getId(), currentUser.getId(), "marketplace_sold", item.getId());
            }
        }

        MarketplaceItem saved = marketplaceItemRepository.save(item);
        return marketplaceMapper.toResponseDto(saved);
    }

    // 9. Đánh giá người bán (chỉ người mua mới có thể đánh giá)
    @Transactional
    public SellerReviewResponseDto createSellerReview(Long sellerId, SellerReviewCreateDto dto, User currentUser) {
        if (currentUser.getId().equals(sellerId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Bạn không thể tự đánh giá chính mình");
        }

        User seller = userRepository.findById(sellerId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy người bán"));

        MarketplaceItem item = null;
        if (dto.getItemId() != null) {
            item = marketplaceItemRepository.findById(dto.getItemId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy sản phẩm"));

            if (!item.getSellerId().equals(sellerId)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Sản phẩm này không thuộc về người bán này");
            }

            // Kiểm tra trạng thái đã bán
            if (!"sold".equalsIgnoreCase(item.getStatus())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Sản phẩm chưa được đánh dấu đã bán");
            }

            // Kiểm tra người mua: nếu item đã gán buyerId, phải khớp với currentUser
            if (item.getBuyerId() != null && !item.getBuyerId().equals(currentUser.getId())) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Chỉ người mua sản phẩm này mới có quyền đánh giá");
            }

            // Tránh đánh giá trùng lặp cho cùng 1 sản phẩm
            if (sellerReviewRepository.existsByItemIdAndReviewerId(item.getId(), currentUser.getId())) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Bạn đã đánh giá người bán cho sản phẩm này rồi");
            }

            // Nếu item chưa set buyerId, gán buyerId cho currentUser
            if (item.getBuyerId() == null) {
                item.setBuyer(currentUser);
                marketplaceItemRepository.save(item);
            }
        } else {
            // Nếu không truyền itemId cụ thể, kiểm tra xem currentUser đã từng mua sản phẩm nào từ người bán này chưa
            List<MarketplaceItem> userBoughtItems = marketplaceItemRepository.findByBuyerIdOrderByIdDesc(currentUser.getId());
            boolean hasPurchasedFromSeller = userBoughtItems.stream()
                    .anyMatch(i -> i.getSellerId().equals(sellerId));

            if (!hasPurchasedFromSeller) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Bạn chưa mua hàng từ người bán này nên chưa thể gửi đánh giá");
            }
        }

        SellerReview review = SellerReview.builder()
                .seller(seller)
                .reviewer(currentUser)
                .item(item)
                .rating(dto.getRating())
                .comment(dto.getComment())
                .build();

        SellerReview savedReview = sellerReviewRepository.save(review);

        // Gửi thông báo cho người bán
        notificationService.createNotification(sellerId, currentUser.getId(), "marketplace_review", savedReview.getId());

        return marketplaceMapper.toReviewResponseDto(savedReview);
    }

    // 10. Lấy danh sách đánh giá của người bán
    @Transactional(readOnly = true)
    public List<SellerReviewResponseDto> getSellerReviews(Long sellerId) {
        return sellerReviewRepository.findBySellerIdOrderByCreatedAtDesc(sellerId).stream()
                .map(marketplaceMapper::toReviewResponseDto)
                .collect(Collectors.toList());
    }

    // 11. Xem hồ sơ người bán (thông tin + rating + thống kê tin đăng)
    @Transactional(readOnly = true)
    public SellerProfileDto getSellerProfile(Long sellerId) {
        User seller = userRepository.findById(sellerId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy người bán"));

        Double avgRating = sellerReviewRepository.getAverageRatingBySellerId(sellerId);
        long reviewCount = sellerReviewRepository.countBySellerId(sellerId);

        List<MarketplaceItem> allSellerItems = marketplaceItemRepository.findBySellerIdOrderByIdDesc(sellerId);
        int activeCount = (int) allSellerItems.stream().filter(i -> "active".equalsIgnoreCase(i.getStatus())).count();
        int soldCount = (int) allSellerItems.stream().filter(i -> "sold".equalsIgnoreCase(i.getStatus())).count();

        List<SellerReviewResponseDto> reviews = sellerReviewRepository.findBySellerIdOrderByCreatedAtDesc(sellerId).stream()
                .map(marketplaceMapper::toReviewResponseDto)
                .collect(Collectors.toList());

        return SellerProfileDto.builder()
                .id(seller.getId())
                .username(seller.getUsername())
                .fullName(seller.getFullName())
                .avatarUrl(seller.getAvatarUrl())
                .location(seller.getLocation())
                .ratingAvg(avgRating != null ? Math.round(avgRating * 10.0) / 10.0 : null)
                .ratingCount(reviewCount)
                .activeItemsCount(activeCount)
                .soldItemsCount(soldCount)
                .reviews(reviews)
                .build();
    }
}
