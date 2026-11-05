package com.bookingmakeup.repository;

import com.bookingmakeup.entity.UserVoucher;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserVoucherRepository extends JpaRepository<UserVoucher, Long> {
    List<UserVoucher> findByUserIdOrderByCreatedAtDesc(Long userId);
    List<UserVoucher> findByUserIdAndIsUsedFalse(Long userId);
    Optional<UserVoucher> findByUserIdAndVoucherIdAndIsUsedFalse(Long userId, Long voucherId);
    boolean existsByUserIdAndVoucherIdAndIsUsedFalse(Long userId, Long voucherId);
    boolean existsByUserIdAndVoucherId(Long userId, Long voucherId);
}
