package com.bookingmakeup.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "makeup_layouts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MakeupLayout extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false, unique = true, length = 50)
    private String code;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "suitable_for", length = 255)
    private String suitableFor;

    @Column(length = 50)
    private String tag;

    @Column(length = 100)
    private String gradient;

    @Column(name = "border_active", length = 100)
    private String borderActive;

    @Column(name = "badge_class", length = 100)
    private String badgeClass;

    @Column(length = 50)
    private String category;

    @Column(name = "search_keyword", length = 50)
    private String searchKeyword;

    @Column(name = "thumbnail_url", length = 500)
    private String thumbnailUrl;

    @Column(nullable = false)
    @Builder.Default
    private Boolean active = true;

    @Column(name = "display_order", nullable = false)
    @Builder.Default
    private Integer displayOrder = 0;
}
