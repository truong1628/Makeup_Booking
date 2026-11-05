package com.bookingmakeup.repository;

import com.bookingmakeup.entity.MakeupLayout;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MakeupLayoutRepository extends JpaRepository<MakeupLayout, Long> {

    List<MakeupLayout> findByActiveTrueOrderByDisplayOrderAsc();

    List<MakeupLayout> findAllByOrderByDisplayOrderAsc();

    Optional<MakeupLayout> findByCode(String code);

    boolean existsByCode(String code);

    boolean existsByCodeAndIdNot(String code, Long id);
}
