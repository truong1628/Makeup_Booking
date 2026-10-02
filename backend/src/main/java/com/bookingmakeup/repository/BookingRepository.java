package com.bookingmakeup.repository;

import com.bookingmakeup.entity.Booking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {
    List<Booking> findByUserIdOrderByBookingDateDescBookingTimeDesc(Long userId);
    List<Booking> findAllByOrderByBookingDateDescBookingTimeDesc();
    List<Booking> findAllByOrderByCreatedAtDesc();
    List<Booking> findByUserIdOrderByCreatedAtDesc(Long userId);
    List<Booking> findByUserIdOrderByIdDesc(Long userId);
}
