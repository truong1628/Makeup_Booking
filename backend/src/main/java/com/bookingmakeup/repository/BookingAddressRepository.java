package com.bookingmakeup.repository;

import com.bookingmakeup.entity.BookingAddress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface BookingAddressRepository extends JpaRepository<BookingAddress, Long> {
    Optional<BookingAddress> findByBookingId(Long bookingId);
}
