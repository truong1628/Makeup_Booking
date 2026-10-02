package com.bookingmakeup.entity;

import com.bookingmakeup.enums.BookingStatus;
import com.bookingmakeup.enums.ExecutionMode;
import com.bookingmakeup.enums.LocationType;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "bookings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Booking extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @JsonIgnore
    private User user;

    @Column(name = "booking_date", nullable = false)
    private LocalDate bookingDate;

    @Column(name = "booking_time", nullable = false)
    private LocalTime bookingTime;

    @Column(name = "target_end_time")
    private LocalTime targetEndTime;

    @Enumerated(EnumType.STRING)
    @Column(name = "location_type", nullable = false, length = 20)
    @Builder.Default
    private LocationType locationType = LocationType.STUDIO;

    @Enumerated(EnumType.STRING)
    @Column(name = "execution_mode", nullable = false, length = 20)
    @Builder.Default
    private ExecutionMode executionMode = ExecutionMode.SINGLE;

    @Column(name = "artist_count", nullable = false)
    @Builder.Default
    private Integer artistCount = 1;

    @Column(name = "dispatch_plan", length = 30)
    @Builder.Default
    private String dispatchPlan = "SAVING";

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    @Builder.Default
    private BookingStatus status = BookingStatus.PENDING_PAYMENT;

    @Column(name = "total_price", nullable = false, precision = 12, scale = 2)
    private BigDecimal totalPrice;

    @Column(name = "surcharge", nullable = false, precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal surcharge = BigDecimal.ZERO;

    @Column(name = "deposit_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal depositAmount;

    @Column(name = "layout", length = 100)
    private String layout;

    @Lob
    @Column(name = "customer_image", columnDefinition = "LONGTEXT")
    private String customerImage;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @JsonIgnore
    @OneToOne(mappedBy = "booking", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private BookingAddress bookingAddress;

    @JsonIgnore
    @OneToMany(mappedBy = "booking", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<BookingItem> items = new ArrayList<>();

    @JsonIgnore
    @OneToOne(mappedBy = "booking", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private Review review;

    @JsonIgnore
    @OneToMany(mappedBy = "booking", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<Payment> payments = new ArrayList<>();
}
