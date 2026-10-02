package com.bookingmakeup.repository;

import com.bookingmakeup.entity.MakeupArtist;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MakeupArtistRepository extends JpaRepository<MakeupArtist, Long> {
    Optional<MakeupArtist> findByUserId(Long userId);

    @Query("SELECT a FROM MakeupArtist a JOIN FETCH a.user")
    List<MakeupArtist> findAllWithUser();
}
