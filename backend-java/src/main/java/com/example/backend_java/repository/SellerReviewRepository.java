package com.example.backend_java.repository;

import com.example.backend_java.entity.SellerReview;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SellerReviewRepository extends JpaRepository<SellerReview, Long> {

    List<SellerReview> findBySellerIdOrderByCreatedAtDesc(Long sellerId);

    boolean existsByItemIdAndReviewerId(Long itemId, Long reviewerId);

    @Query("SELECT AVG(r.rating) FROM SellerReview r WHERE r.sellerId = :sellerId")
    Double getAverageRatingBySellerId(@Param("sellerId") Long sellerId);

    long countBySellerId(Long sellerId);
}
