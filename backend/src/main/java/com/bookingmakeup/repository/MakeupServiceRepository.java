package com.bookingmakeup.repository;

import com.bookingmakeup.entity.MakeupService;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MakeupServiceRepository extends JpaRepository<MakeupService, Long> {
    List<MakeupService> findByActiveTrue();
    List<MakeupService> findByActiveTrueAndIsComboFalse();
    List<MakeupService> findByActiveTrueAndIsComboTrue();
    List<MakeupService> findByActiveTrueAndCategoryId(Long categoryId);
    List<MakeupService> findByActiveTrueAndCategoryCode(String code);
}
