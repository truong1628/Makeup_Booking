package com.bookingmakeup.repository;

import com.bookingmakeup.entity.Booking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.bookingmakeup.enums.BookingStatus;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {
    List<Booking> findByUserIdOrderByBookingDateDescBookingTimeDesc(Long userId);
    List<Booking> findAllByOrderByBookingDateDescBookingTimeDesc();
    List<Booking> findAllByOrderByCreatedAtDesc();
    List<Booking> findAllByOrderByCreatedAtDescIdDesc();
    List<Booking> findAllByOrderByIdDesc();
    List<Booking> findByUserIdOrderByCreatedAtDesc(Long userId);
    List<Booking> findByUserIdOrderByIdDesc(Long userId);
    long countByUserId(Long userId);
    long countByUserIdAndVoucherIdAndStatusNot(Long userId, Long voucherId, BookingStatus status);
    long countByUserIdAndStatusNot(Long userId, BookingStatus status);
    List<Booking> findByUserIdAndStatusNot(Long userId, BookingStatus status);
    List<Booking> findByStatusAndCreatedAtBefore(BookingStatus status, LocalDateTime dateTime);
}
