package com.example.backend_java.controller;

import com.example.backend_java.dto.common.MessageDto;
import com.example.backend_java.dto.common.PagedResponseDto;
import com.example.backend_java.dto.marketplace.*;
import com.example.backend_java.entity.User;
import com.example.backend_java.service.MarketplaceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/marketplace")
@RequiredArgsConstructor
public class MarketplaceController {

    private final MarketplaceService marketplaceService;

    // POST /marketplace - Đăng bán sản phẩm (cần token)
    @PostMapping("")
    public ResponseEntity<MarketplaceItemResponseDto> createItem(
            @Valid @RequestBody MarketplaceItemCreateDto dto,
            Authentication authentication) {
        User currentUser = (User) authentication.getPrincipal();
        return ResponseEntity.ok(marketplaceService.createItem(dto, currentUser));
    }

    // GET /marketplace - Duyệt danh sách sản phẩm (public, hỗ trợ phân trang & lọc)
    @GetMapping("")
    public ResponseEntity<PagedResponseDto<MarketplaceItemResponseDto>> getItems(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size,
            @RequestParam(required = false) String category,
            @RequestParam(name = "min_price", required = false) BigDecimal minPrice,
            @RequestParam(name = "max_price", required = false) BigDecimal maxPrice,
            @RequestParam(required = false) String query) {
        return ResponseEntity.ok(marketplaceService.getItems(page, size, category, minPrice, maxPrice, query));
    }

    // GET /marketplace/my-items - Tin đăng của tôi (cần token)
    @GetMapping("/my-items")
    public ResponseEntity<List<MarketplaceItemResponseDto>> getMyItems(Authentication authentication) {
        User currentUser = (User) authentication.getPrincipal();
        return ResponseEntity.ok(marketplaceService.getMyItems(currentUser));
    }

    // GET /marketplace/{id} - Chi tiết sản phẩm (public)
    @GetMapping("/{id}")
    public ResponseEntity<MarketplaceItemResponseDto> getItemById(@PathVariable Long id) {
        return ResponseEntity.ok(marketplaceService.getItemById(id));
    }

    // GET /marketplace/seller/{sellerId} - Danh sách tin của một người bán (public)
    @GetMapping("/seller/{sellerId}")
    public ResponseEntity<List<MarketplaceItemResponseDto>> getItemsBySeller(@PathVariable Long sellerId) {
        return ResponseEntity.ok(marketplaceService.getItemsBySeller(sellerId));
    }

    // PUT /marketplace/{id} - Chỉnh sửa tin đăng (cần token, chỉ người bán)
    @PutMapping("/{id}")
    public ResponseEntity<MarketplaceItemResponseDto> updateItem(
            @PathVariable Long id,
            @RequestBody MarketplaceItemUpdateDto dto,
            Authentication authentication) {
        User currentUser = (User) authentication.getPrincipal();
        return ResponseEntity.ok(marketplaceService.updateItem(id, dto, currentUser));
    }

    // DELETE /marketplace/{id} - Xóa tin đăng (cần token, chỉ người bán)
    @DeleteMapping("/{id}")
    public ResponseEntity<MessageDto> deleteItem(
            @PathVariable Long id,
            Authentication authentication) {
        User currentUser = (User) authentication.getPrincipal();
        marketplaceService.deleteItem(id, currentUser);
        return ResponseEntity.ok(new MessageDto("Đã xóa sản phẩm thành công"));
    }

    // PATCH /marketplace/{id}/sold - Đánh dấu sản phẩm đã bán (cần token, chỉ người bán)
    @PatchMapping("/{id}/sold")
    public ResponseEntity<MarketplaceItemResponseDto> markAsSold(
            @PathVariable Long id,
            @RequestBody(required = false) MarkSoldRequestDto dto,
            Authentication authentication) {
        User currentUser = (User) authentication.getPrincipal();
        return ResponseEntity.ok(marketplaceService.markAsSold(id, dto, currentUser));
    }

    // POST /marketplace/sellers/{sellerId}/reviews - Đánh giá người bán (chỉ người mua đã mua hàng)
    @PostMapping("/sellers/{sellerId}/reviews")
    public ResponseEntity<SellerReviewResponseDto> createSellerReview(
            @PathVariable Long sellerId,
            @Valid @RequestBody SellerReviewCreateDto dto,
            Authentication authentication) {
        User currentUser = (User) authentication.getPrincipal();
        return ResponseEntity.ok(marketplaceService.createSellerReview(sellerId, dto, currentUser));
    }

    // GET /marketplace/sellers/{sellerId}/reviews - Lấy danh sách đánh giá của người bán (public)
    @GetMapping("/sellers/{sellerId}/reviews")
    public ResponseEntity<List<SellerReviewResponseDto>> getSellerReviews(@PathVariable Long sellerId) {
        return ResponseEntity.ok(marketplaceService.getSellerReviews(sellerId));
    }

    // GET /marketplace/sellers/{sellerId}/profile - Lấy hồ sơ người bán (public)
    @GetMapping("/sellers/{sellerId}/profile")
    public ResponseEntity<SellerProfileDto> getSellerProfile(@PathVariable Long sellerId) {
        return ResponseEntity.ok(marketplaceService.getSellerProfile(sellerId));
    }
}
