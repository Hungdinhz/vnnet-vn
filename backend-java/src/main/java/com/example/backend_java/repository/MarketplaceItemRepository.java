package com.example.backend_java.repository;

import com.example.backend_java.entity.MarketplaceItem;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MarketplaceItemRepository extends JpaRepository<MarketplaceItem, Long>, JpaSpecificationExecutor<MarketplaceItem> {

    // Lấy tất cả item active, mới nhất trước
    Page<MarketplaceItem> findByStatusOrderByIdDesc(String status, Pageable pageable);

    // Lấy theo seller
    List<MarketplaceItem> findBySellerIdOrderByIdDesc(Long sellerId);

    // Lấy theo buyer
    List<MarketplaceItem> findByBuyerIdOrderByIdDesc(Long buyerId);
}
