package com.bookingmakeup.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "makeup_artists")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MakeupArtist extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    @JsonIgnore
    private User user;

    @Column(length = 100)
    private String experience;

    @Column(length = 255)
    private String specialties;

    @Column(name = "working_hours", length = 100)
    private String workingHours;

    @Column(name = "working_days", length = 100)
    private String workingDays;

    @Column(nullable = false)
    @Builder.Default
    private Boolean active = true;
}
