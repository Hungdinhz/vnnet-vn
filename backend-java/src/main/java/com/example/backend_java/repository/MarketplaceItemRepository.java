package com.example.backend_java.repository;

import com.example.backend_java.entity.MarketplaceItem;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface MarketplaceItemRepository extends JpaRepository<MarketplaceItem, Long> {

    // Lấy tất cả item active, mới nhất trước
    Page<MarketplaceItem> findByStatusOrderByIdDesc(String status, Pageable pageable);

    // Lấy theo seller
    List<MarketplaceItem> findBySellerIdOrderByIdDesc(Long sellerId);

    // Lấy theo buyer
    List<MarketplaceItem> findByBuyerIdOrderByIdDesc(Long buyerId);

    // Tìm kiếm và lọc linh hoạt: category, minPrice, maxPrice, query
    @Query("SELECT m FROM MarketplaceItem m WHERE " +
           "(:status IS NULL OR m.status = :status) AND " +
           "(:category IS NULL OR :category = '' OR :category = 'all' OR m.category = :category) AND " +
           "(:minPrice IS NULL OR m.price >= :minPrice) AND " +
           "(:maxPrice IS NULL OR m.price <= :maxPrice) AND " +
           "(:query IS NULL OR :query = '' OR " +
           "LOWER(m.title) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(m.description) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(m.location) LIKE LOWER(CONCAT('%', :query, '%'))) " +
           "ORDER BY m.id DESC")
    Page<MarketplaceItem> searchAndFilterItems(
            @Param("status") String status,
            @Param("category") String category,
            @Param("minPrice") BigDecimal minPrice,
            @Param("maxPrice") BigDecimal maxPrice,
            @Param("query") String query,
            Pageable pageable);
}
