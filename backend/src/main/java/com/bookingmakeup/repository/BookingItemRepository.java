package com.bookingmakeup.repository;

import com.bookingmakeup.entity.BookingItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Repository
public interface BookingItemRepository extends JpaRepository<BookingItem, Long> {

    List<BookingItem> findByBookingId(Long bookingId);

    @Query("SELECT bi FROM BookingItem bi " +
           "WHERE bi.makeupArtist.id = :artistId " +
           "AND bi.booking.bookingDate = :bookingDate " +
           "AND bi.booking.status <> com.bookingmakeup.enums.BookingStatus.CANCELLED " +
           "AND bi.startTime < :endTime AND bi.endTime > :startTime")
    List<BookingItem> findOverlappingItems(
            @Param("artistId") Long artistId,
            @Param("bookingDate") LocalDate bookingDate,
            @Param("startTime") LocalTime startTime,
            @Param("endTime") LocalTime endTime
    );

    @Query("SELECT bi FROM BookingItem bi " +
           "WHERE bi.makeupArtist.id = :artistId " +
           "ORDER BY bi.booking.bookingDate DESC, bi.startTime DESC")
    List<BookingItem> findByArtistIdOrderByDateAndTime(@Param("artistId") Long artistId);

    boolean existsByMakeupArtistId(Long artistId);
}
