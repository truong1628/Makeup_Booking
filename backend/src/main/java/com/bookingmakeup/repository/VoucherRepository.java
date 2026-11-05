package com.bookingmakeup.repository;

import com.bookingmakeup.entity.Voucher;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface VoucherRepository extends JpaRepository<Voucher, Long> {

    Optional<Voucher> findByCodeIgnoreCase(String code);

    boolean existsByCodeIgnoreCase(String code);

    boolean existsByCodeIgnoreCaseAndIdNot(String code, Long id);

    List<Voucher> findAllByOrderByCreatedAtDesc();

    @Query("SELECT v FROM Voucher v WHERE v.active = true " +
           "AND (v.startDate IS NULL OR v.startDate <= :now) " +
           "AND (v.endDate IS NULL OR v.endDate >= :now) " +
           "AND (v.usageLimit IS NULL OR v.usedCount < v.usageLimit) " +
           "ORDER BY v.createdAt DESC")
    List<Voucher> findAvailableVouchers(@Param("now") LocalDateTime now);

    @Query("SELECT v FROM Voucher v WHERE v.active = true " +
           "AND (v.voucherScope IS NULL OR v.voucherScope = com.bookingmakeup.enums.VoucherScope.PUBLIC) " +
           "AND (v.startDate IS NULL OR v.startDate <= :now) " +
           "AND (v.endDate IS NULL OR v.endDate >= :now) " +
           "AND (v.usageLimit IS NULL OR v.usedCount < v.usageLimit) " +
           "ORDER BY v.createdAt DESC")
    List<Voucher> findAvailablePublicVouchers(@Param("now") LocalDateTime now);
}
