package com.bookingmakeup.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "service_combo_items")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ServiceComboItem extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "combo_service_id", nullable = false)
    @JsonIgnore
    private MakeupService comboService;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "item_service_id", nullable = false)
    private MakeupService itemService;

    @Column(nullable = false)
    @Builder.Default
    private Integer quantity = 1;
}
