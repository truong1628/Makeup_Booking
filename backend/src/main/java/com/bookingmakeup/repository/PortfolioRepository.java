package com.bookingmakeup.repository;

import com.bookingmakeup.entity.Portfolio;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PortfolioRepository extends JpaRepository<Portfolio, Long> {

    List<Portfolio> findByMakeupArtistIdOrderByCreatedAtDesc(Long makeupArtistId);

    @Query("SELECT p FROM Portfolio p WHERE " +
           "(:artistId IS NULL OR p.makeupArtist.id = :artistId) AND " +
           "(:categoryName IS NULL OR :categoryName = '' OR LOWER(p.categoryName) = LOWER(:categoryName)) AND " +
           "(:keyword IS NULL OR :keyword = '' OR " +
           " LOWER(p.title) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           " LOWER(p.tags) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           " LOWER(p.description) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           " LOWER(p.makeupArtist.user.fullName) LIKE LOWER(CONCAT('%', :keyword, '%'))) " +
           "ORDER BY p.createdAt DESC")
    List<Portfolio> searchPortfolios(
            @Param("artistId") Long artistId,
            @Param("categoryName") String categoryName,
            @Param("keyword") String keyword
    );

    @Query("SELECT DISTINCT p.categoryName FROM Portfolio p WHERE p.categoryName IS NOT NULL AND p.categoryName <> ''")
    List<String> findDistinctCategories();
}
