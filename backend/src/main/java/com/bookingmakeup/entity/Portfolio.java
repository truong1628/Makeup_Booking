package com.bookingmakeup.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "portfolios")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Portfolio extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "makeup_artist_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private MakeupArtist makeupArtist;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "image_url", columnDefinition = "LONGTEXT", nullable = false)
    private String imageUrl;

    @Column(name = "additional_images", columnDefinition = "TEXT")
    private String additionalImages;

    @Column(name = "category_name", length = 100)
    private String categoryName;

    @Column(length = 255)
    private String tags;

    @Column(name = "view_count", nullable = false)
    @Builder.Default
    private Integer viewCount = 0;
}
