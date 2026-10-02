package com.bookingmakeup.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "makeup_services")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MakeupService extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "service_name", nullable = false, length = 150)
    private String serviceName;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal price;

    @Column(nullable = false)
    @Builder.Default
    private Integer duration = 60;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(columnDefinition = "LONGTEXT")
    private String image;

    @Column(name = "is_combo", nullable = false)
    @Builder.Default
    private Boolean isCombo = false;

    @Column(nullable = false)
    @Builder.Default
    private Boolean active = true;

    @JsonIgnore
    @OneToMany(mappedBy = "comboService", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<ServiceComboItem> comboItems = new ArrayList<>();
}
