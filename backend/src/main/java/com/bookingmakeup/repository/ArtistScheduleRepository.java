package com.bookingmakeup.repository;

import com.bookingmakeup.entity.ArtistSchedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface ArtistScheduleRepository extends JpaRepository<ArtistSchedule, Long> {
    Optional<ArtistSchedule> findByMakeupArtistIdAndScheduleDate(Long makeupArtistId, LocalDate scheduleDate);
    List<ArtistSchedule> findByMakeupArtistIdOrderByScheduleDateAsc(Long makeupArtistId);
    List<ArtistSchedule> findByScheduleDateBetweenOrderByScheduleDateAsc(LocalDate startDate, LocalDate endDate);
}

