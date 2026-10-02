package com.bookingmakeup.repository;

import com.bookingmakeup.entity.ServiceComboItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ServiceComboItemRepository extends JpaRepository<ServiceComboItem, Long> {
    List<ServiceComboItem> findByComboServiceId(Long comboServiceId);
    void deleteByComboServiceId(Long comboServiceId);
}

