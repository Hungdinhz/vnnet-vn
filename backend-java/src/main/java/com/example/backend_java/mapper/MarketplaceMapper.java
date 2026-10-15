package com.example.backend_java.mapper;

import com.example.backend_java.dto.marketplace.MarketplaceItemResponseDto;
import com.example.backend_java.dto.marketplace.SellerReviewResponseDto;
import com.example.backend_java.entity.MarketplaceItem;
import com.example.backend_java.entity.SellerReview;
import com.example.backend_java.entity.User;
import com.example.backend_java.repository.SellerReviewRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.List;

@Component
@RequiredArgsConstructor
public class MarketplaceMapper {

    private final SellerReviewRepository sellerReviewRepository;

    public MarketplaceItemResponseDto toResponseDto(MarketplaceItem item) {
        User seller = item.getSeller();
        List<String> images = (item.getImageUrls() != null && !item.getImageUrls().isBlank())
                ? Arrays.asList(item.getImageUrls().split("\\|\\|\\|"))
                : List.of();

        Double avgRating = sellerReviewRepository.getAverageRatingBySellerId(seller.getId());
        long reviewCount = sellerReviewRepository.countBySellerId(seller.getId());

        MarketplaceItemResponseDto.BuyerDto buyerDto = null;
        if (item.getBuyer() != null) {
            User buyer = item.getBuyer();
            buyerDto = MarketplaceItemResponseDto.BuyerDto.builder()
                    .id(buyer.getId())
                    .username(buyer.getUsername())
                    .fullName(buyer.getFullName())
                    .avatarUrl(buyer.getAvatarUrl())
                    .build();
        }

        return MarketplaceItemResponseDto.builder()
                .id(item.getId())
                .title(item.getTitle())
                .description(item.getDescription())
                .price(item.getPrice())
                .category(item.getCategory())
                .condition(item.getCondition())
                .location(item.getLocation())
                .imageUrls(images)
                .status(item.getStatus())
                .sellerId(seller.getId())
                .seller(MarketplaceItemResponseDto.SellerDto.builder()
                        .id(seller.getId())
                        .username(seller.getUsername())
                        .fullName(seller.getFullName())
                        .avatarUrl(seller.getAvatarUrl())
                        .location(seller.getLocation())
                        .ratingAvg(avgRating != null ? Math.round(avgRating * 10.0) / 10.0 : null)
                        .ratingCount(reviewCount)
                        .build())
                .buyerId(item.getBuyerId())
                .buyer(buyerDto)
                .viewsCount(item.getViewsCount())
                .createdAt(item.getCreatedAt())
                .updatedAt(item.getUpdatedAt())
                .build();
    }

    public SellerReviewResponseDto toReviewResponseDto(SellerReview review) {
        User reviewer = review.getReviewer();
        return SellerReviewResponseDto.builder()
                .id(review.getId())
                .sellerId(review.getSellerId())
                .reviewerId(reviewer.getId())
                .reviewer(SellerReviewResponseDto.ReviewerDto.builder()
                        .id(reviewer.getId())
                        .username(reviewer.getUsername())
                        .fullName(reviewer.getFullName())
                        .avatarUrl(reviewer.getAvatarUrl())
                        .build())
                .itemId(review.getItemId())
                .itemTitle(review.getItem() != null ? review.getItem().getTitle() : null)
                .rating(review.getRating())
                .comment(review.getComment())
                .createdAt(review.getCreatedAt())
                .build();
    }
}
