package com.bookingmakeup.repository;

import com.bookingmakeup.entity.ServiceCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ServiceCategoryRepository extends JpaRepository<ServiceCategory, Long> {

    List<ServiceCategory> findByActiveTrueOrderByDisplayOrderAsc();

    List<ServiceCategory> findAllByOrderByDisplayOrderAsc();

    Optional<ServiceCategory> findByCode(String code);

    boolean existsByCode(String code);

    boolean existsByCodeAndIdNot(String code, Long id);
}
