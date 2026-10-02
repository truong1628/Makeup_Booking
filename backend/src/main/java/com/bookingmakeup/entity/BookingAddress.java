package com.bookingmakeup.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "booking_addresses")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BookingAddress extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "booking_id", nullable = false, unique = true)
    @JsonIgnore
    private Booking booking;

    @Column(nullable = false, length = 255)
    private String address;

    @Column(name = "distance_km", precision = 6, scale = 2)
    @Builder.Default
    private BigDecimal distanceKm = BigDecimal.ZERO;

    @Column(name = "travel_fee", precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal travelFee = BigDecimal.ZERO;
}
